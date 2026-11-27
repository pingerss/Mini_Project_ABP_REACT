using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

namespace MiniLms.Enrollments.Dtos;

public class EnrollmentDto : EntityDto<Guid>
{
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public DateTime EnrolledAt { get; set; }
    public EnrollmentStatus Status { get; set; }
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int ProgressPercent { get; set; }
}

public class CourseLearningDto
{
    public Guid EnrollmentId { get; set; }
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public EnrollmentStatus Status { get; set; }
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int ProgressPercent { get; set; }
    public List<LessonWithProgressDto> Lessons { get; set; } = new();
}

public class LessonWithProgressDto
{
    public Guid LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int QuizQuestionCount { get; set; }
}

public class ToggleLessonProgressInput
{
    public Guid CourseId { get; set; }
    public Guid LessonId { get; set; }
    public bool IsCompleted { get; set; }
}