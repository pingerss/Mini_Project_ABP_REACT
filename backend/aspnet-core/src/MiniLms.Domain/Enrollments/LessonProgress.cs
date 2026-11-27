using System;
using Volo.Abp.Domain.Entities;

namespace MiniLms.Enrollments;

/// <summary>
/// Bảng LessonProgresses: Lưu trạng thái hoàn thành của từng bài học theo lượt đăng ký.
/// </summary>
public class LessonProgress : Entity<Guid>
{
    // Khóa ngoại (FK) trỏ tới bảng Enrollments.Id
    public Guid EnrollmentId { get; private set; }

    // Khóa ngoại (FK) trỏ tới bảng Lessons.Id
    public Guid LessonId { get; private set; }

    public bool IsCompleted { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    protected LessonProgress() { }

    public LessonProgress(Guid id, Guid enrollmentId, Guid lessonId, bool isCompleted = false)
        : base(id)
    {
        EnrollmentId = enrollmentId;
        LessonId = lessonId;
        SetCompletion(isCompleted);
    }

    public void SetCompletion(bool isCompleted)
    {
        IsCompleted = isCompleted;
        CompletedAt = isCompleted ? DateTime.UtcNow : null;
    }
}