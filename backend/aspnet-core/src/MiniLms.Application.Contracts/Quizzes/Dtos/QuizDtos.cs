using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace MiniLms.Quizzes.Dtos;

/// <summary>
/// DTO câu hỏi trắc nghiệm dành riêng cho Giảng viên / Admin (có chứa đáp án đúng CorrectOption).
/// </summary>
public class QuizQuestionManageDto : EntityDto<Guid>
{
    public Guid LessonId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public string CorrectOption { get; set; } = "A";
    public int OrderIndex { get; set; }
}

public class CreateUpdateQuizQuestionDto
{
    [Required]
    public Guid LessonId { get; set; }

    [Required]
    [StringLength(1000)]
    public string QuestionText { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string OptionA { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string OptionB { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string OptionC { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string OptionD { get; set; } = string.Empty;

    [Required]
    [StringLength(2)]
    public string CorrectOption { get; set; } = "A";

    public int OrderIndex { get; set; } = 1;
}

/// <summary>
/// DTO câu hỏi trả về cho Học viên làm bài (TUYỆT ĐỐI KHÔNG chứa CorrectOption để tránh lộ đáp án trong F12 Network).
/// </summary>
public class StudentQuizQuestionItemDto
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
}

public class StudentQuizPaperDto
{
    public Guid LessonId { get; set; }
    public int PassingScorePercent { get; set; } = 70;
    public int TotalAttempts { get; set; }
    public int? BestScorePercent { get; set; }
    public bool IsPassed { get; set; }
    public List<StudentQuizQuestionItemDto> Questions { get; set; } = new();
}

public class QuizAnswerSubmissionDto
{
    public Guid QuestionId { get; set; }
    public string SelectedOption { get; set; } = string.Empty;
}

public class SubmitQuizInputDto
{
    [Required]
    public Guid CourseId { get; set; }

    [Required]
    public Guid LessonId { get; set; }

    [Required]
    public List<QuizAnswerSubmissionDto> Answers { get; set; } = new();
}

public class QuizQuestionFeedbackDto
{
    public Guid QuestionId { get; set; }
    public string SelectedOption { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class QuizSubmitResultDto
{
    public Guid LessonId { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectAnswers { get; set; }
    public int ScorePercent { get; set; }
    public int PassingScorePercent { get; set; } = 70;
    public bool IsPassed { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<QuizQuestionFeedbackDto> QuestionFeedbacks { get; set; } = new();
}
