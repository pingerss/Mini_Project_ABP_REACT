using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using MiniLms.Courses;
using MiniLms.Enrollments.Dtos;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace MiniLms.Enrollments;

[Authorize]
public class EnrollmentAppService : ApplicationService, IEnrollmentAppService
{
    private readonly IRepository<Enrollment, Guid> _enrollmentRepository;
    private readonly IRepository<LessonProgress, Guid> _progressRepository;
    private readonly IRepository<Course, Guid> _courseRepository;
    private readonly IRepository<Lesson, Guid> _lessonRepository;

    public EnrollmentAppService(
        IRepository<Enrollment, Guid> enrollmentRepository,
        IRepository<LessonProgress, Guid> progressRepository,
        IRepository<Course, Guid> courseRepository,
        IRepository<Lesson, Guid> lessonRepository)
    {
        _enrollmentRepository = enrollmentRepository;
        _progressRepository = progressRepository;
        _courseRepository = courseRepository;
        _lessonRepository = lessonRepository;
    }

    // Tự động sinh API: POST /api/app/enrollment/enroll/{courseId}
    public async Task<EnrollmentDto> EnrollAsync(Guid courseId)
    {
        if (!CurrentUser.IsInRole("admin") && !CurrentUser.IsInRole("Instructor"))
        {
            throw new UserFriendlyException("Học viên không tự đăng ký khóa học. Vui lòng liên hệ Giảng viên để được gán vào khóa học.");
        }

        var studentId = CurrentUser.GetId();
        var course = await _courseRepository.GetAsync(courseId);

        if (course.Status != CourseStatus.Published)
        {
            throw new UserFriendlyException("Khóa học này hiện chưa mở đăng ký!");
        }

        var existing = await _enrollmentRepository.FirstOrDefaultAsync(
            x => x.CourseId == courseId && x.StudentId == studentId);

        if (existing != null)
        {
            return await MapToEnrollmentDtoAsync(existing, course);
        }

        var enrollment = new Enrollment(
            GuidGenerator.Create(),
            courseId,
            studentId,
            Clock.Now
        );

        await _enrollmentRepository.InsertAsync(enrollment, autoSave: true);
        return await MapToEnrollmentDtoAsync(enrollment, course);
    }

    // Tự động sinh API: GET /api/app/enrollment/my-enrollments
    public async Task<List<EnrollmentDto>> GetMyEnrollmentsAsync()
    {
        var studentId = CurrentUser.GetId();
        var enrollments = await _enrollmentRepository.GetListAsync(x => x.StudentId == studentId);
        var result = new List<EnrollmentDto>();

        foreach (var enrollment in enrollments)
        {
            var course = await _courseRepository.GetAsync(enrollment.CourseId);
            result.Add(await MapToEnrollmentDtoAsync(enrollment, course));
        }

        return result;
    }

    // Tự động sinh API: GET /api/app/enrollment/learning-course/{courseId}
    public async Task<CourseLearningDto> GetLearningCourseAsync(Guid courseId)
    {
        var studentId = CurrentUser.GetId();
        var course = await _courseRepository.GetAsync(courseId);

        var enrollment = await _enrollmentRepository.FirstOrDefaultAsync(
            x => x.CourseId == courseId && x.StudentId == studentId);

        if (enrollment == null)
        {
            throw new UserFriendlyException("Bạn cần đăng ký tham gia khóa học trước khi xem bài giảng.");
        }

        var lessons = (await _lessonRepository.GetListAsync(x => x.CourseId == courseId))
            .OrderBy(x => x.OrderIndex)
            .ToList();

        var progresses = await _progressRepository.GetListAsync(x => x.EnrollmentId == enrollment.Id);

        var lessonItems = lessons.Select(l =>
        {
            var prog = progresses.FirstOrDefault(p => p.LessonId == l.Id);
            return new LessonWithProgressDto
            {
                LessonId = l.Id,
                Title = l.Title,
                VideoUrl = l.VideoUrl,
                Content = l.Content,
                OrderIndex = l.OrderIndex,
                IsCompleted = prog?.IsCompleted ?? false,
                CompletedAt = prog?.CompletedAt
            };
        }).ToList();

        var total = lessonItems.Count;
        var completed = lessonItems.Count(x => x.IsCompleted);
        var percent = total > 0 ? (int)Math.Round((double)completed * 100 / total) : 0;

        return new CourseLearningDto
        {
            EnrollmentId = enrollment.Id,
            CourseId = course.Id,
            CourseTitle = course.Title,
            Status = enrollment.Status,
            TotalLessons = total,
            CompletedLessons = completed,
            ProgressPercent = percent,
            Lessons = lessonItems
        };
    }

    // Tự động sinh API: POST /api/app/enrollment/toggle-lesson-progress
    public async Task<CourseLearningDto> ToggleLessonProgressAsync(ToggleLessonProgressInput input)
    {
        var studentId = CurrentUser.GetId();

        var enrollment = await _enrollmentRepository.FirstOrDefaultAsync(
            x => x.CourseId == input.CourseId && x.StudentId == studentId);

        if (enrollment == null)
        {
            throw new UserFriendlyException("Không tìm thấy thông tin đăng ký khóa học của bạn.");
        }

        var progress = await _progressRepository.FirstOrDefaultAsync(
            x => x.EnrollmentId == enrollment.Id && x.LessonId == input.LessonId);

        if (progress == null)
        {
            progress = new LessonProgress(
                GuidGenerator.Create(),
                enrollment.Id,
                input.LessonId,
                input.IsCompleted
            );
            await _progressRepository.InsertAsync(progress, autoSave: true);
        }
        else
        {
            progress.SetCompletion(input.IsCompleted);
            await _progressRepository.UpdateAsync(progress, autoSave: true);
        }

        var totalLessons = await _lessonRepository.CountAsync(x => x.CourseId == input.CourseId);
        await _enrollmentRepository.EnsureCollectionLoadedAsync(enrollment, x => x.LessonProgresses);
        enrollment.RecalculateCompletionStatus(totalLessons);
        await _enrollmentRepository.UpdateAsync(enrollment, autoSave: true);

        return await GetLearningCourseAsync(input.CourseId);
    }

    private async Task<EnrollmentDto> MapToEnrollmentDtoAsync(Enrollment enrollment, Course course)
    {
        var totalLessons = await _lessonRepository.CountAsync(x => x.CourseId == course.Id);
        var completedLessons = await _progressRepository.CountAsync(
            x => x.EnrollmentId == enrollment.Id && x.IsCompleted);
        var percent = totalLessons > 0
            ? (int)Math.Round((double)completedLessons * 100 / totalLessons)
            : 0;

        return new EnrollmentDto
        {
            Id = enrollment.Id,
            CourseId = course.Id,
            CourseTitle = course.Title,
            StudentId = enrollment.StudentId,
            EnrolledAt = enrollment.EnrolledAt,
            Status = enrollment.Status,
            TotalLessons = totalLessons,
            CompletedLessons = completedLessons,
            ProgressPercent = percent
        };
    }
}