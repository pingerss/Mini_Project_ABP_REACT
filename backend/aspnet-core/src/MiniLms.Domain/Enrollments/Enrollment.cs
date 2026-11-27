using System;
using System.Collections.Generic;
using System.Linq;
using Volo.Abp.Domain.Entities.Auditing;

namespace MiniLms.Enrollments;

/// <summary>
/// Bảng Enrollments: Ghi nhận lượt đăng ký khóa học của một Học viên.
/// </summary>
public class Enrollment : FullAuditedAggregateRoot<Guid>
{
    // Khóa ngoại (FK) trỏ tới bảng Courses.Id
    public Guid CourseId { get; private set; }

    // Khóa ngoại (FK) trỏ tới bảng AbpUsers.Id (Tài khoản Học viên)
    public Guid StudentId { get; private set; }

    public DateTime EnrolledAt { get; private set; }
    public EnrollmentStatus Status { get; private set; }

    // Quan hệ 1-N: Một lượt đăng ký theo dõi tiến độ của nhiều bài học
    public ICollection<LessonProgress> LessonProgresses { get; private set; } = new List<LessonProgress>();

    protected Enrollment() { }

    public Enrollment(Guid id, Guid courseId, Guid studentId, DateTime enrolledAt)
        : base(id)
    {
        CourseId = courseId;
        StudentId = studentId;
        EnrolledAt = enrolledAt;
        Status = EnrollmentStatus.Active;
    }

    /// <summary>
    /// Quy tắc nghiệp vụ: Tự động chuyển trạng thái khóa học sang Completed khi hoàn thành đủ số bài học.
    /// </summary>
    public void RecalculateCompletionStatus(int totalLessonsInCourse)
    {
        if (totalLessonsInCourse <= 0) return;

        var completedCount = LessonProgresses.Count(x => x.IsCompleted);
        Status = completedCount >= totalLessonsInCourse
            ? EnrollmentStatus.Completed
            : EnrollmentStatus.Active;
    }
}