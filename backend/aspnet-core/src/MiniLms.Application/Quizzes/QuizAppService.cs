using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using MiniLms.Courses;
using MiniLms.Enrollments;
using MiniLms.Quizzes.Dtos;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace MiniLms.Quizzes;

/// <summary>
/// Quản lý câu hỏi trắc nghiệm (cho Giảng viên) và Chấm điểm tự động / Cập nhật tiến độ bài học (cho Học viên).
/// </summary>
[Authorize]
public class QuizAppService : ApplicationService, IQuizAppService
{
    public const int DefaultPassingScorePercent = 70;

    private readonly IRepository<QuizQuestion, Guid> _questionRepository;
    private readonly IRepository<QuizAttempt, Guid> _attemptRepository;
    private readonly IRepository<Lesson, Guid> _lessonRepository;
    private readonly IRepository<Course, Guid> _courseRepository;
    private readonly IRepository<Enrollment, Guid> _enrollmentRepository;
    private readonly IRepository<LessonProgress, Guid> _progressRepository;

    public QuizAppService(
        IRepository<QuizQuestion, Guid> questionRepository,
        IRepository<QuizAttempt, Guid> attemptRepository,
        IRepository<Lesson, Guid> lessonRepository,
        IRepository<Course, Guid> courseRepository,
        IRepository<Enrollment, Guid> enrollmentRepository,
        IRepository<LessonProgress, Guid> progressRepository)
    {
        _questionRepository = questionRepository;
        _attemptRepository = attemptRepository;
        _lessonRepository = lessonRepository;
        _courseRepository = courseRepository;
        _enrollmentRepository = enrollmentRepository;
        _progressRepository = progressRepository;
    }

    // API: GET /api/app/quiz/manage-questions/{lessonId}
    public async Task<List<QuizQuestionManageDto>> GetManageQuestionsAsync(Guid lessonId)
    {
        var lesson = await _lessonRepository.GetAsync(lessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        var questions = await _questionRepository.GetListAsync(x => x.LessonId == lessonId);
        return questions
            .OrderBy(x => x.OrderIndex)
            .Select(MapToManageDto)
            .ToList();
    }

    // API: POST /api/app/quiz/question
    public async Task<QuizQuestionManageDto> CreateQuestionAsync(CreateUpdateQuizQuestionDto input)
    {
        var lesson = await _lessonRepository.GetAsync(input.LessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        var question = new QuizQuestion(
            GuidGenerator.Create(),
            input.LessonId,
            input.QuestionText,
            input.OptionA,
            input.OptionB,
            input.OptionC,
            input.OptionD,
            input.CorrectOption,
            input.OrderIndex
        );

        await _questionRepository.InsertAsync(question, autoSave: true);
        return MapToManageDto(question);
    }

    // API: PUT /api/app/quiz/question/{id}
    public async Task<QuizQuestionManageDto> UpdateQuestionAsync(Guid id, CreateUpdateQuizQuestionDto input)
    {
        var question = await _questionRepository.GetAsync(id);
        var lesson = await _lessonRepository.GetAsync(question.LessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        question.Update(
            input.QuestionText,
            input.OptionA,
            input.OptionB,
            input.OptionC,
            input.OptionD,
            input.CorrectOption,
            input.OrderIndex
        );

        await _questionRepository.UpdateAsync(question, autoSave: true);
        return MapToManageDto(question);
    }

    // API: DELETE /api/app/quiz/question/{id}
    public async Task DeleteQuestionAsync(Guid id)
    {
        var question = await _questionRepository.GetAsync(id);
        var lesson = await _lessonRepository.GetAsync(question.LessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        await _questionRepository.DeleteAsync(question, autoSave: true);
    }

    // API: GET /api/app/quiz/student-quiz/{lessonId}
    public async Task<StudentQuizPaperDto> GetStudentQuizAsync(Guid lessonId)
    {
        var studentId = CurrentUser.GetId();
        var lesson = await _lessonRepository.GetAsync(lessonId);
        var enrollment = await _enrollmentRepository.FirstOrDefaultAsync(
            x => x.CourseId == lesson.CourseId && x.StudentId == studentId);

        var questions = (await _questionRepository.GetListAsync(x => x.LessonId == lessonId))
            .OrderBy(x => x.OrderIndex)
            .ToList();

        var attempts = enrollment != null
            ? await _attemptRepository.GetListAsync(x => x.EnrollmentId == enrollment.Id && x.LessonId == lessonId)
            : new List<QuizAttempt>();

        var bestScore = attempts.Count > 0 ? attempts.Max(a => a.ScorePercent) : (int?)null;
        var isPassed = attempts.Any(a => a.IsPassed);

        return new StudentQuizPaperDto
        {
            LessonId = lessonId,
            PassingScorePercent = DefaultPassingScorePercent,
            TotalAttempts = attempts.Count,
            BestScorePercent = bestScore,
            IsPassed = isPassed,
            Questions = questions.Select(q => new StudentQuizQuestionItemDto
            {
                Id = q.Id,
                QuestionText = q.QuestionText,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD,
                OrderIndex = q.OrderIndex
            }).ToList()
        };
    }

    // API: POST /api/app/quiz/submit-quiz
    public async Task<QuizSubmitResultDto> SubmitQuizAsync(SubmitQuizInputDto input)
    {
        var studentId = CurrentUser.GetId();
        var enrollment = await _enrollmentRepository.FirstOrDefaultAsync(
            x => x.CourseId == input.CourseId && x.StudentId == studentId);

        if (enrollment == null)
        {
            throw new UserFriendlyException("Không tìm thấy thông tin đăng ký khóa học của bạn.");
        }

        var questions = (await _questionRepository.GetListAsync(x => x.LessonId == input.LessonId))
            .OrderBy(x => x.OrderIndex)
            .ToList();

        if (questions.Count == 0)
        {
            throw new UserFriendlyException("Bài học này chưa có câu hỏi kiểm tra trắc nghiệm.");
        }

        var feedbacks = new List<QuizQuestionFeedbackDto>();
        var correctCount = 0;

        foreach (var q in questions)
        {
            var submitted = input.Answers?.FirstOrDefault(a => a.QuestionId == q.Id);
            var selected = (submitted?.SelectedOption ?? string.Empty).Trim().ToUpperInvariant();
            var isCorrect = string.Equals(selected, q.CorrectOption, StringComparison.OrdinalIgnoreCase);

            if (isCorrect)
            {
                correctCount++;
            }

            feedbacks.Add(new QuizQuestionFeedbackDto
            {
                QuestionId = q.Id,
                SelectedOption = selected,
                IsCorrect = isCorrect
            });
        }

        var totalQuestions = questions.Count;
        var scorePercent = (int)Math.Round((double)correctCount * 100 / totalQuestions);
        var isPassed = scorePercent >= DefaultPassingScorePercent;

        var attempt = new QuizAttempt(
            GuidGenerator.Create(),
            enrollment.Id,
            input.LessonId,
            totalQuestions,
            correctCount,
            scorePercent,
            isPassed,
            Clock.Now
        );
        await _attemptRepository.InsertAsync(attempt, autoSave: true);

        // Nếu Học viên đạt >= 70%, tự động đánh dấu hoàn thành bài học (LessonProgress.IsCompleted = true)
        if (isPassed)
        {
            var progress = await _progressRepository.FirstOrDefaultAsync(
                x => x.EnrollmentId == enrollment.Id && x.LessonId == input.LessonId);

            if (progress == null)
            {
                progress = new LessonProgress(
                    GuidGenerator.Create(),
                    enrollment.Id,
                    input.LessonId,
                    isCompleted: true
                );
                await _progressRepository.InsertAsync(progress, autoSave: true);
            }
            else if (!progress.IsCompleted)
            {
                progress.SetCompletion(true);
                await _progressRepository.UpdateAsync(progress, autoSave: true);
            }

            // Tính toán lại trạng thái hoàn thành khóa học (Enrollment.Status)
            var totalLessons = await _lessonRepository.CountAsync(x => x.CourseId == input.CourseId);
            await _enrollmentRepository.EnsureCollectionLoadedAsync(enrollment, x => x.LessonProgresses);
            enrollment.RecalculateCompletionStatus(totalLessons);
            await _enrollmentRepository.UpdateAsync(enrollment, autoSave: true);
        }

        var message = isPassed
            ? $"Chúc mừng! Bạn đạt {correctCount}/{totalQuestions} câu ({scorePercent}%) và đã hoàn thành bài học này!"
            : $"Bạn trả lời đúng {correctCount}/{totalQuestions} câu ({scorePercent}%). Cần đạt tối thiểu {DefaultPassingScorePercent}% để hoàn thành bài học. Hãy thử lại nhé!";

        return new QuizSubmitResultDto
        {
            LessonId = input.LessonId,
            TotalQuestions = totalQuestions,
            CorrectAnswers = correctCount,
            ScorePercent = scorePercent,
            PassingScorePercent = DefaultPassingScorePercent,
            IsPassed = isPassed,
            Message = message,
            QuestionFeedbacks = feedbacks
        };
    }

    private void EnsureInstructorOrAdmin(Guid ownerInstructorId)
    {
        var isAdmin = CurrentUser.IsInRole("admin");
        var isInstructor = CurrentUser.IsInRole("Instructor");

        if (!isAdmin && !isInstructor)
        {
            throw new AbpAuthorizationException("Chỉ Giảng viên hoặc Admin mới được phép quản lý câu hỏi trắc nghiệm.");
        }

        if (!isAdmin && ownerInstructorId != CurrentUser.GetId())
        {
            throw new AbpAuthorizationException("Bạn chỉ có thể quản lý câu hỏi trắc nghiệm thuộc khóa học của mình.");
        }
    }

    private static QuizQuestionManageDto MapToManageDto(QuizQuestion q)
    {
        return new QuizQuestionManageDto
        {
            Id = q.Id,
            LessonId = q.LessonId,
            QuestionText = q.QuestionText,
            OptionA = q.OptionA,
            OptionB = q.OptionB,
            OptionC = q.OptionC,
            OptionD = q.OptionD,
            CorrectOption = q.CorrectOption,
            OrderIndex = q.OrderIndex
        };
    }
}
