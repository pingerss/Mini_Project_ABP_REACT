using System;
using System.Collections.Generic;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace MiniLms.Courses;

/// <summary>
/// Bảng Courses: Lưu thông tin khóa học.
/// Kế thừa FullAuditedAggregateRoot<Guid> để có sẵn khóa chính Id (Guid) và các cột lịch sử/xóa mềm.
/// </summary>
public class Course : FullAuditedAggregateRoot<Guid>
{
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;

    // Khóa ngoại (FK) trỏ tới bảng AbpUsers.Id (Tài khoản Giảng viên tạo khóa học)
    public Guid InstructorId { get; private set; }

    public CourseStatus Status { get; private set; }

    // Quan hệ 1-N: Một khóa học bao gồm nhiều bài học
    public ICollection<Lesson> Lessons { get; private set; } = new List<Lesson>();

    // WHY: EF Core bắt buộc phải có constructor không tham số (protected/private) để nạp dữ liệu từ SQLite lên RAM
    protected Course() { }

    public Course(
        Guid id,
        string title,
        string description,
        Guid instructorId,
        CourseStatus status = CourseStatus.Published)
        : base(id)
    {
        SetTitle(title);
        Description = description ?? string.Empty;
        InstructorId = instructorId;
        Status = status;
    }

    // WHY: Dùng private set + hàm SetTitle để bảo vệ quy tắc nghiệp vụ: Tên khóa học không bao giờ được rỗng
    public void SetTitle(string title)
    {
        Title = Check.NotNullOrWhiteSpace(title, nameof(title), maxLength: 200);
    }

    public void UpdateInfo(string title, string description, CourseStatus status)
    {
        SetTitle(title);
        Description = description ?? string.Empty;
        Status = status;
    }
}