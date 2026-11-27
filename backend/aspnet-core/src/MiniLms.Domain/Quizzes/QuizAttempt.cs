using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace MiniLms.Quizzes;

/// <summary>
/// Bảng QuizAttempts: Lưu lịch sử mỗi lần Học viên nộp bài kiểm tra trắc nghiệm của một bài học.
/// </summary>
public class QuizAttempt : CreationAuditedEntity<Guid>
{
    public Guid EnrollmentId { get; private set; }
    public Guid LessonId { get; private set; }
    public int TotalQuestions { get; private set; }
    public int CorrectAnswers { get; private set; }
    public int ScorePercent { get; private set; }
    public bool IsPassed { get; private set; }
    public DateTime SubmittedAt { get; private set; }

    protected QuizAttempt() { }

    public QuizAttempt(
        Guid id,
        Guid enrollmentId,
        Guid lessonId,
        int totalQuestions,
        int correctAnswers,
        int scorePercent,
        bool isPassed,
        DateTime submittedAt)
        : base(id)
    {
        EnrollmentId = enrollmentId;
        LessonId = lessonId;
        TotalQuestions = totalQuestions;
        CorrectAnswers = correctAnswers;
        ScorePercent = scorePercent;
        IsPassed = isPassed;
        SubmittedAt = submittedAt;
    }
}
