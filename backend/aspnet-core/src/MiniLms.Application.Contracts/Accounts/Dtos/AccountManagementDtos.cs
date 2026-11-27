using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MiniLms.Enrollments;

namespace MiniLms.Accounts.Dtos;

/// <summary>
/// DTO dùng cho màn hình Đăng ký công khai (/register) — Mặc định đăng ký làm Giảng viên (Instructor) có kiểm tra Mã mời.
/// </summary>
public class RegisterInstructorDto
{
    [Required]
    [StringLength(128)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string InviteCode { get; set; } = string.Empty;
}

/// <summary>
/// DTO dùng cho Giảng viên / Admin tạo tài khoản Học viên và gán thẳng vào khóa học.
/// </summary>
public class CreateStudentDto
{
    [Required]
    [StringLength(128)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Danh sách ID các khóa học sẽ được tự động đăng ký (Auto-Enroll) ngay khi tạo tài khoản Học viên.
    /// </summary>
    public List<Guid> CourseIds { get; set; } = new();
}

public class AssignCoursesToStudentDto
{
    [Required]
    public Guid StudentId { get; set; }

    [Required]
    public List<Guid> CourseIds { get; set; } = new();
}

public class ResetStudentPasswordDto
{
    [Required]
    public Guid StudentId { get; set; }

    [Required]
    [StringLength(128, MinimumLength = 6)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangeMyPasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 6)]
    public string NewPassword { get; set; } = string.Empty;
}

public class StudentEnrolledCourseItemDto
{
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public EnrollmentStatus Status { get; set; }
    public int CompletedLessons { get; set; }
    public int TotalLessons { get; set; }
    public int ProgressPercent { get; set; }
}

public class StudentAccountDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreationTime { get; set; }
    public List<StudentEnrolledCourseItemDto> EnrolledCourses { get; set; } = new();
}
