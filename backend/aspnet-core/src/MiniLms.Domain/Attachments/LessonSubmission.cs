using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace MiniLms.Attachments;

/// <summary>
/// Bảng LessonSubmissions: Lưu bài tập thực hành do Học viên nộp ở từng bài học và Điểm số / Nhận xét của Giảng viên.
/// </summary>
public class LessonSubmission : FullAuditedEntity<Guid>
{
    public Guid EnrollmentId { get; private set; }
    public Guid LessonId { get; private set; }
    public Guid StudentId { get; private set; }
    public string SubmissionUrl { get; private set; } = string.Empty;
    public string Note { get; private set; } = string.Empty;
    public int? Grade { get; private set; }
    public string InstructorFeedback { get; private set; } = string.Empty;
    public DateTime SubmittedAt { get; private set; }
    public DateTime? GradedAt { get; private set; }

    protected LessonSubmission() { }

    public LessonSubmission(
        Guid id,
        Guid enrollmentId,
        Guid lessonId,
        Guid studentId,
        string submissionUrl,
        string note,
        DateTime submittedAt)
        : base(id)
    {
        EnrollmentId = enrollmentId;
        LessonId = lessonId;
        StudentId = studentId;
        UpdateSubmission(submissionUrl, note, submittedAt);
    }

    public void UpdateSubmission(string submissionUrl, string note, DateTime submittedAt)
    {
        SubmissionUrl = Check.NotNullOrWhiteSpace(submissionUrl, nameof(submissionUrl), maxLength: 1000);
        Note = (note ?? string.Empty).Trim();
        SubmittedAt = submittedAt;
    }

    public void SetGrade(int grade, string feedback, DateTime gradedAt)
    {
        if (grade < 0 || grade > 100)
        {
            throw new BusinessException("MiniLms:InvalidGrade").WithData("Grade", grade);
        }

        Grade = grade;
        InstructorFeedback = (feedback ?? string.Empty).Trim();
        GradedAt = gradedAt;
    }
}
