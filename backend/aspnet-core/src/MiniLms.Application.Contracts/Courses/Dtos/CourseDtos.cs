using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace MiniLms.Courses.Dtos;

public class CourseDto : EntityDto<Guid>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid InstructorId { get; set; }
    public string InstructorName { get; set; } = string.Empty;
    public CourseStatus Status { get; set; }
    public DateTime CreationTime { get; set; }

    // Thông tin tổng hợp phục vụ trực tiếp cho giao diện React
    public int TotalLessons { get; set; }
    public bool IsEnrolled { get; set; }
    public Guid? EnrollmentId { get; set; }
    public List<LessonDto> Lessons { get; set; } = new();
}

public class LessonDto : EntityDto<Guid>
{
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
}

public class CreateUpdateCourseDto
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    public CourseStatus Status { get; set; } = CourseStatus.Published;
}

public class CreateUpdateLessonDto
{
    [Required]
    public Guid CourseId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    public string VideoUrl { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int OrderIndex { get; set; } = 1;
}