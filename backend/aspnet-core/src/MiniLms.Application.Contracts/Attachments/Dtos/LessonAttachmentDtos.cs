using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace MiniLms.Attachments.Dtos;

public class LessonMaterialDto : EntityDto<Guid>
{
    public Guid LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = "FILE";
    public DateTime CreationTime { get; set; }
}

public class CreateLessonMaterialDto
{
    [Required]
    public Guid LessonId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string FileUrl { get; set; } = string.Empty;

    [StringLength(50)]
    public string FileType { get; set; } = "FILE";
}

public class LessonSubmissionDto : EntityDto<Guid>
{
    public Guid EnrollmentId { get; set; }
    public Guid LessonId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentUserName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string SubmissionUrl { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public int? Grade { get; set; }
    public string InstructorFeedback { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }
}

public class SubmitLessonAssignmentDto
{
    [Required]
    public Guid CourseId { get; set; }

    [Required]
    public Guid LessonId { get; set; }

    [Required]
    [StringLength(1000)]
    public string SubmissionUrl { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Note { get; set; } = string.Empty;
}

public class GradeLessonSubmissionDto
{
    [Required]
    public Guid SubmissionId { get; set; }

    [Range(0, 100)]
    public int Grade { get; set; }

    [StringLength(1000)]
    public string InstructorFeedback { get; set; } = string.Empty;
}
