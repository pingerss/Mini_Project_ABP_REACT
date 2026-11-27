using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace MiniLms.Attachments;

/// <summary>
/// Bảng LessonMaterials: Lưu danh sách tài liệu học tập (File upload hoặc Link ngoài) do Giảng viên đính kèm vào từng bài học (Lesson).
/// </summary>
public class LessonMaterial : FullAuditedEntity<Guid>
{
    public Guid LessonId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string FileUrl { get; private set; } = string.Empty;
    public string FileType { get; private set; } = "FILE";

    protected LessonMaterial() { }

    public LessonMaterial(
        Guid id,
        Guid lessonId,
        string title,
        string fileUrl,
        string fileType = "FILE")
        : base(id)
    {
        LessonId = lessonId;
        Title = Check.NotNullOrWhiteSpace(title, nameof(title), maxLength: 200);
        FileUrl = Check.NotNullOrWhiteSpace(fileUrl, nameof(fileUrl), maxLength: 1000);
        FileType = string.IsNullOrWhiteSpace(fileType)
            ? "FILE"
            : fileType.Trim().ToUpperInvariant();
    }
}
