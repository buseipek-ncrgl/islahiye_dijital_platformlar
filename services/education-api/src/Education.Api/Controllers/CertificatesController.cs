using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/certificates")]
public sealed class CertificatesController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CertificateResponse>>> List(
        [FromQuery] string? studentId,
        [FromQuery] Guid? termId,
        [FromQuery] CertificateStatus? status)
    {
        var query = db.Certificates.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(studentId)) query = query.Where(x => x.StudentUserId == studentId);
        if (termId.HasValue) query = query.Where(x => x.TermId == termId.Value);
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);

        var list = await query.OrderByDescending(x => x.IssueDate).ToListAsync();
        return Ok(list.Select(Map).ToList());
    }

    [HttpGet("verify/{code}"), AllowAnonymous]
    public async Task<ActionResult<CertificateVerifyResponse>> Verify(string code)
    {
        var c = code.Trim().ToUpperInvariant();
        var item = await db.Certificates.AsNoTracking()
            .SingleOrDefaultAsync(x => x.VerificationCode.ToUpper() == c || x.CertificateNumber.ToUpper() == c);

        if (item is null)
        {
            return Ok(new CertificateVerifyResponse(
                IsValid: false,
                StudentName: null,
                ProgramName: null,
                TermName: null,
                CertificateNumber: null,
                VerificationCode: null,
                IssueDate: null,
                Status: null,
                Message: "Doğrulama koduyla eşleşen resmî sertifika kaydı bulunamadı."
            ));
        }

        if (item.Status == CertificateStatus.Revoked)
        {
            return Ok(new CertificateVerifyResponse(
                IsValid: false,
                StudentName: item.StudentName,
                ProgramName: item.ProgramName,
                TermName: item.TermName,
                CertificateNumber: item.CertificateNumber,
                VerificationCode: item.VerificationCode,
                IssueDate: item.IssueDate,
                Status: item.Status,
                Message: $"Bu sertifika {item.RevokedAt:dd.MM.yyyy} tarihinde iptal edilmiştir. Gerekçe: {item.RevocationReason}"
            ));
        }

        return Ok(new CertificateVerifyResponse(
            IsValid: true,
            StudentName: item.StudentName,
            ProgramName: item.ProgramName,
            TermName: item.TermName,
            CertificateNumber: item.CertificateNumber,
            VerificationCode: item.VerificationCode,
            IssueDate: item.IssueDate,
            Status: item.Status,
            Message: "Sertifika İslahiye Belediyesi merkezi kütüğünde kayıtlı ve geçerlidir."
        ));
    }

    [HttpGet("{id:guid}/pdf"), AllowAnonymous]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        var item = await db.Certificates.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound("Sertifika bulunamadı.");

        var pdfBytes = Services.CertificatePdfGenerator.GenerateA4Landscape(
            item.StudentName,
            item.ProgramName,
            item.TermName,
            item.CertificateNumber,
            item.VerificationCode,
            item.IssueDate
        );

        return File(pdfBytes, "application/pdf", $"Sertifika_{item.CertificateNumber}.pdf");
    }

    [HttpGet("verify/{code}/pdf"), AllowAnonymous]
    public async Task<IActionResult> DownloadVerifyPdf(string code)
    {
        var c = code.Trim().ToUpperInvariant();
        var item = await db.Certificates.AsNoTracking()
            .SingleOrDefaultAsync(x => x.VerificationCode.ToUpper() == c || x.CertificateNumber.ToUpper() == c);

        if (item is null) return NotFound("Doğrulama koduyla eşleşen sertifika bulunamadı.");

        var pdfBytes = Services.CertificatePdfGenerator.GenerateA4Landscape(
            item.StudentName,
            item.ProgramName,
            item.TermName,
            item.CertificateNumber,
            item.VerificationCode,
            item.IssueDate
        );

        return File(pdfBytes, "application/pdf", $"Sertifika_{item.CertificateNumber}.pdf");
    }

    [HttpPost("issue")]
    public async Task<ActionResult<CertificateResponse>> Issue(CertificateIssueRequest request)
    {
        var count = await db.Certificates.CountAsync();
        var certNo = $"ISL-SRT-{DateTime.UtcNow.Year}-{(count + 1):D4}";

        var codeBytes = RandomNumberGenerator.GetBytes(4);
        var verificationCode = $"ISL-{Convert.ToHexString(codeBytes).ToUpperInvariant()}";

        var program = await db.Programs.FindAsync(request.ProgramId);
        var term = await db.Terms.FindAsync(request.TermId);

        var item = new CertificateEntity
        {
            StudentUserId = request.StudentUserId,
            StudentName = request.StudentName.Trim(),
            ProgramId = request.ProgramId,
            ProgramName = program?.Name ?? "Eğitim Programı",
            TermId = request.TermId,
            TermName = term?.Name ?? "Eğitim Dönemi",
            CertificateNumber = certNo,
            VerificationCode = verificationCode,
            IssueDate = request.IssueDate,
            ExpiryDate = request.ExpiryDate,
            Status = CertificateStatus.Active
        };

        db.Certificates.Add(item);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "certificate.issue",
            EntityType = "Certificate",
            EntityId = item.Id.ToString(),
            Detail = $"Sertifika düzenlendi: {certNo} ({item.StudentName})"
        });

        await db.SaveChangesAsync();

        return Created($"/api/v1/certificates/{item.Id}", Map(item));
    }

    [HttpPatch("{id:guid}/revoke")]
    public async Task<ActionResult<CertificateResponse>> Revoke(Guid id, [FromBody] string reason)
    {
        var item = await db.Certificates.FindAsync(id);
        if (item is null) return NotFound();

        item.Status = CertificateStatus.Revoked;
        item.RevocationReason = reason;
        item.RevokedAt = DateTime.UtcNow;

        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "certificate.revoke",
            EntityType = "Certificate",
            EntityId = item.Id.ToString(),
            Detail = $"Sertifika iptal edildi: {item.CertificateNumber}. Neden: {reason}"
        });

        await db.SaveChangesAsync();
        return Ok(Map(item));
    }

    private static CertificateResponse Map(CertificateEntity x) =>
        new(
            x.Id,
            x.StudentUserId,
            x.StudentName,
            x.ProgramId,
            x.ProgramName,
            x.TermId,
            x.TermName,
            x.CertificateNumber,
            x.VerificationCode,
            x.IssueDate,
            x.ExpiryDate,
            x.PdfUrl,
            x.Status,
            x.RevocationReason,
            x.RevokedAt
        );
}

