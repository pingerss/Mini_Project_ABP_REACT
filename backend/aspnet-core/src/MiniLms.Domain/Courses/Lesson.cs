using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace MiniLms.Courses;

/// <summary>
/// Bảng Lessons: Lưu thông tin từng bài giảng thuộc một khóa học.
/// </summary>
public class Lesson : FullAuditedEntity<Guid>
{
    // Khóa ngoại (FK) trỏ tới bảng Courses.Id
    public Guid CourseId { get; private set; }

    public string Title { get; private set; } = string.Empty;
    public string VideoUrl { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;

    // Thứ tự bài học trong khóa (1, 2, 3...)
    public int OrderIndex { get; private set; }

    protected Lesson() { }

    public Lesson(Guid id, Guid courseId, string title, string videoUrl, string content, int orderIndex)
        : base(id)
    {
        CourseId = courseId;
        Title = Check.NotNullOrWhiteSpace(title, nameof(title), maxLength: 200);
        VideoUrl = videoUrl ?? string.Empty;
        Content = content ?? string.Empty;
        OrderIndex = orderIndex;
    }

    public void Update(string title, string videoUrl, string content, int orderIndex)
    {
        Title = Check.NotNullOrWhiteSpace(title, nameof(title), maxLength: 200);
        VideoUrl = videoUrl ?? string.Empty;
        Content = content ?? string.Empty;
        OrderIndex = orderIndex;
    }
}