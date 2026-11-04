using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/files")]
public sealed class FilesController(EducationDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".jpg", ".jpeg", ".png", ".docx", ".doc", ".zip"
    };

    [HttpPost("upload")]
    public async Task<ActionResult<FileUploadResponse>> Upload(IFormFile? file, [FromQuery] string folder = "general")
    {
        if (file is null || file.Length == 0)
            return BadRequest("Yüklenecek dosya seçilmedi.");

        if (file.Length > 25 * 1024 * 1024) // 25 MB limit
            return BadRequest("Dosya boyutu 25 MB sınırını aşıyor.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest($"Desteklenmeyen dosya formatı ({ext}). İzin verilenler: PDF, JPG, PNG, DOCX, ZIP");

        var cleanFolder = folder.ToLowerInvariant() switch
        {
            "documents" => "documents",
            "assignments" => "assignments",
            "certificates" => "certificates",
            _ => "general"
        };

        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var uploadDir = Path.Combine(webRoot, "uploads", cleanFolder);
        Directory.CreateDirectory(uploadDir);

        var safeFileName = $"{cleanFolder}_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}{ext}";
        var physicalPath = Path.Combine(uploadDir, safeFileName);

        await using (var stream = new FileStream(physicalPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/uploads/{cleanFolder}/{safeFileName}";

        return Ok(new FileUploadResponse(
            Url: relativeUrl,
            FileName: file.FileName,
            ContentType: file.ContentType,
            FileSizeBytes: file.Length,
            UploadedAt: DateTime.UtcNow
        ));
    }

    [HttpPost("/api/v1/applications/{applicationId:guid}/documents")]
    public async Task<ActionResult<ApplicationDocumentDto>> UploadApplicationDocument(
        Guid applicationId,
        IFormFile? file,
        [FromForm] string documentType)
    {
        var application = await db.Applications.Include(x => x.Documents).SingleOrDefaultAsync(x => x.Id == applicationId);
        if (application is null) return NotFound("Başvuru bulunamadı.");

        if (file is null || file.Length == 0) return BadRequest("Dosya yüklenmedi.");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext)) return BadRequest($"Desteklenmeyen dosya türü: {ext}");

        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var uploadDir = Path.Combine(webRoot, "uploads", "documents");
        Directory.CreateDirectory(uploadDir);

        var safeFileName = $"doc_{applicationId:N}_{Guid.NewGuid():N}{ext}";
        var physicalPath = Path.Combine(uploadDir, safeFileName);

        await using (var stream = new FileStream(physicalPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var doc = new ApplicationDocumentEntity
        {
            ApplicationId = applicationId,
            DocumentType = string.IsNullOrWhiteSpace(documentType) ? "Genel Belge" : documentType.Trim(),
            FileName = file.FileName,
            FilePath = $"/uploads/documents/{safeFileName}",
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            Status = DocumentVerificationStatus.Clean,
            VerifiedAt = DateTime.UtcNow
        };

        db.ApplicationDocuments.Add(doc);
        await db.SaveChangesAsync();

        return Created($"/api/v1/applications/{applicationId}/documents/{doc.Id}", new ApplicationDocumentDto(
            doc.Id,
            doc.DocumentType,
            doc.FileName,
            doc.ContentType,
            doc.FileSizeBytes,
            doc.Status,
            doc.VerifiedAt
        ));
    }
}

public sealed record FileUploadResponse(
    string Url,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    DateTime UploadedAt
);

