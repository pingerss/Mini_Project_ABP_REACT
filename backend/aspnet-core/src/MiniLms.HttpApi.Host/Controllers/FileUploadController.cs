using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace MiniLms.Controllers;

/// <summary>
/// Controller xử lý upload file trực tiếp từ máy tính (Tài liệu bài giảng PDF/DOCX/ZIP hoặc Bài tập nộp của Học viên).
/// Lưu vào thư mục wwwroot/uploads/ và trả về URL tĩnh để trình duyệt tải/mở trực tiếp.
/// </summary>
[Route("api/upload")]
[Authorize]
public class FileUploadController : AbpControllerBase
{
    private static readonly string[] AllowedExtensions =
    {
        ".pdf", ".doc", ".docx", ".zip", ".rar", ".txt", ".ppt", ".pptx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".md"
    };

    private const long MaxFileSizeBytes = 20 * 1024 * 1024; // 20 MB

    private readonly IWebHostEnvironment _env;

    public FileUploadController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost]
    public async Task<IActionResult> UploadAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new UserFriendlyException("Vui lòng chọn một file để tải lên.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new UserFriendlyException("Dung lượng file tối đa là 20MB.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
        {
            throw new UserFriendlyException(
                $"Định dạng file '{ext}' không được hỗ trợ. Chỉ chấp nhận: {string.Join(", ", AllowedExtensions)}");
        }

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
        }

        var uploadsFolder = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsFolder);

        var safeOriginalName = Path.GetFileNameWithoutExtension(file.FileName)
            .Replace(" ", "_");
        if (safeOriginalName.Length > 40)
        {
            safeOriginalName = safeOriginalName.Substring(0, 40);
        }

        var uniqueFileName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}_{safeOriginalName}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var request = HttpContext.Request;
        var baseUrl = $"{request.Scheme}://{request.Host}";
        var fileUrl = $"{baseUrl}/uploads/{uniqueFileName}";
        var fileType = ext.TrimStart('.').ToUpperInvariant();

        return Ok(new
        {
            fileName = file.FileName,
            fileUrl,
            fileType
        });
    }
}
