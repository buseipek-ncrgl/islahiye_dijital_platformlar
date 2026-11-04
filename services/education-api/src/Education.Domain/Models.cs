namespace Education.Domain;

public enum PublicationStatus { Draft = 0, Published = 1, Archived = 2 }

public abstract class AuditedEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; protected set; } = DateTime.UtcNow;
    public byte[] RowVersion { get; set; } = Guid.NewGuid().ToByteArray();
}

public sealed class EducationProgram : AuditedEntity
{
    private EducationProgram() { }
    public EducationProgram(string name, string slug, string description, string targetAudience,
        string prerequisites, string learningOutcomes)
    {
        Update(name, slug, description, targetAudience, prerequisites, learningOutcomes);
    }
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string TargetAudience { get; private set; } = string.Empty;
    public string Prerequisites { get; private set; } = string.Empty;
    public string LearningOutcomes { get; private set; } = string.Empty;
    public PublicationStatus Status { get; private set; } = PublicationStatus.Draft;
    public ICollection<EducationTerm> Terms { get; } = new List<EducationTerm>();

    public void Update(string name, string slug, string description, string targetAudience,
        string prerequisites, string learningOutcomes)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 200) throw new DomainValidationException("Program adı 1-200 karakter olmalıdır.");
        if (!System.Text.RegularExpressions.Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) throw new DomainValidationException("Slug küçük harf, sayı ve tire içermelidir.");
        Name = name.Trim(); Slug = slug.Trim(); Description = description.Trim();
        TargetAudience = targetAudience.Trim(); Prerequisites = prerequisites.Trim(); LearningOutcomes = learningOutcomes.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
    public void ChangeStatus(PublicationStatus status) { Status = status; UpdatedAt = DateTime.UtcNow; }
}

public sealed class EducationTerm : AuditedEntity
{
    private EducationTerm() { }
    public EducationTerm(Guid programId, string name, DateOnly startDate, DateOnly endDate,
        DateTime applicationStartAt, DateTime applicationEndAt, int capacity)
    { ProgramId = programId; Update(name, startDate, endDate, applicationStartAt, applicationEndAt, capacity); }
    public Guid ProgramId { get; private set; }
    public EducationProgram Program { get; private set; } = null!;
    public string Name { get; private set; } = string.Empty;
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }
    public DateTime ApplicationStartAt { get; private set; }
    public DateTime ApplicationEndAt { get; private set; }
    public int Capacity { get; private set; }
    public PublicationStatus Status { get; private set; } = PublicationStatus.Draft;
    public void Update(string name, DateOnly startDate, DateOnly endDate, DateTime applicationStartAt, DateTime applicationEndAt, int capacity)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 150) throw new DomainValidationException("Dönem adı 1-150 karakter olmalıdır.");
        if (endDate < startDate) throw new DomainValidationException("Dönem bitiş tarihi başlangıçtan önce olamaz.");
        if (applicationEndAt <= applicationStartAt) throw new DomainValidationException("Başvuru bitiş zamanı başlangıçtan sonra olmalıdır.");
        if (DateOnly.FromDateTime(applicationEndAt) > startDate) throw new DomainValidationException("Başvurular eğitim başlangıcından sonra bitemez.");
        if (capacity is < 1 or > 10000) throw new DomainValidationException("Kontenjan 1-10000 arasında olmalıdır.");
        Name = name.Trim(); StartDate = startDate; EndDate = endDate; ApplicationStartAt = applicationStartAt.ToUniversalTime();
        ApplicationEndAt = applicationEndAt.ToUniversalTime(); Capacity = capacity; UpdatedAt = DateTime.UtcNow;
    }
    public void ChangeStatus(PublicationStatus status) { Status = status; UpdatedAt = DateTime.UtcNow; }
}

public enum ApplicationStatus { Draft = 0, Submitted = 1, UnderReview = 2, Accepted = 3, Waitlisted = 4, Rejected = 5, Withdrawn = 6 }
public enum DocumentVerificationStatus { PendingScan = 0, Clean = 1, Verified = 2, Rejected = 3 }

public sealed class ApplicationEntity : AuditedEntity
{
    public string ApplicationNumber { get; set; } = string.Empty;
    public string ApplicantUserId { get; set; } = string.Empty;
    public Guid ProgramId { get; set; }
    public Guid TermId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string BirthDate { get; set; } = string.Empty;
    public string EducationLevel { get; set; } = string.Empty;
    public string Occupation { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string Motivation { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string SpecialNeeds { get; set; } = string.Empty;
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
    public DateTime? SubmittedAt { get; set; }
    public string? AdminNotes { get; set; }
    public string? InternalDecisionNote { get; set; }
    public string? RejectionReason { get; set; }
    public decimal Score { get; set; }
    public ICollection<ApplicationDocumentEntity> Documents { get; set; } = new List<ApplicationDocumentEntity>();
    public ICollection<ApplicationEvaluationEntity> Evaluations { get; set; } = new List<ApplicationEvaluationEntity>();
}

public sealed class ApplicationDocumentEntity : AuditedEntity
{
    public Guid ApplicationId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DocumentVerificationStatus Status { get; set; } = DocumentVerificationStatus.Clean;
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedByUserId { get; set; }
}

public sealed class CriteriaSetEntity : AuditedEntity
{
    public Guid ProgramId { get; set; }
    public Guid? TermId { get; set; }
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public ICollection<CriterionEntity> Criteria { get; set; } = new List<CriterionEntity>();
}

public sealed class CriterionEntity : AuditedEntity
{
    public Guid CriteriaSetId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Weight { get; set; } = 10;
    public int MaxScore { get; set; } = 100;
    public bool IsPrerequisite { get; set; }
    public int OrderIndex { get; set; }
}

public sealed class ApplicationEvaluationEntity : AuditedEntity
{
    public Guid ApplicationId { get; set; }
    public string EvaluatedByUserId { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public string Recommendation { get; set; } = string.Empty;
    public string EvaluationNotes { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class CourseGroupEntity : AuditedEntity
{
    public Guid ProgramId { get; set; }
    public Guid TermId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Classroom { get; set; } = string.Empty;
    public int Capacity { get; set; } = 25;
    public string? InstructorUserId { get; set; }
    public string? InstructorName { get; set; }
    public PublicationStatus Status { get; set; } = PublicationStatus.Published;
    public ICollection<EnrollmentEntity> Students { get; set; } = new List<EnrollmentEntity>();
    public ICollection<CourseSessionEntity> Sessions { get; set; } = new List<CourseSessionEntity>();
    public ICollection<AssignmentEntity> Assignments { get; set; } = new List<AssignmentEntity>();
}

public enum EnrollmentStatus { Active = 1, Completed = 2, Dropped = 3 }

public sealed class EnrollmentEntity : AuditedEntity
{
    public Guid? ApplicationId { get; set; }
    public string StudentUserId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public Guid ProgramId { get; set; }
    public Guid TermId { get; set; }
    public Guid? GroupId { get; set; }
    public string EnrollmentNumber { get; set; } = string.Empty;
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public enum SessionStatus { Scheduled = 1, Completed = 2, Cancelled = 3 }
public enum AttendanceStatus { Present = 1, Absent = 2, Excused = 3 }

public sealed class CourseSessionEntity : AuditedEntity
{
    public Guid GroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string StartTime { get; set; } = "09:00";
    public string EndTime { get; set; } = "12:00";
    public string Classroom { get; set; } = string.Empty;
    public SessionStatus Status { get; set; } = SessionStatus.Scheduled;
    public string? Notes { get; set; }
    public ICollection<AttendanceRecordEntity> AttendanceRecords { get; set; } = new List<AttendanceRecordEntity>();
}

public sealed class AttendanceRecordEntity : AuditedEntity
{
    public Guid SessionId { get; set; }
    public string StudentUserId { get; set; } = string.Empty;
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string RecordedByUserId { get; set; } = string.Empty;
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}

public sealed class AssignmentEntity : AuditedEntity
{
    public Guid GroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public int MaxScore { get; set; } = 100;
    public int Weight { get; set; } = 20;
    public bool IsMandatory { get; set; } = true;
    public ICollection<AssignmentSubmissionEntity> Submissions { get; set; } = new List<AssignmentSubmissionEntity>();
}

public enum SubmissionStatus { Submitted = 1, Graded = 2, RevisionRequested = 3 }

public sealed class AssignmentSubmissionEntity : AuditedEntity
{
    public Guid AssignmentId { get; set; }
    public string StudentUserId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string SubmissionText { get; set; } = string.Empty;
    public string? AttachmentPath { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public decimal? Score { get; set; }
    public string? Feedback { get; set; }
    public string? EvaluatedByUserId { get; set; }
    public DateTime? EvaluatedAt { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
    public int RevisionNumber { get; set; } = 1;
}

public enum SuccessFinalStatus { Successful = 1, Unsuccessful = 2, Conditional = 3 }

public sealed class SuccessDecisionEntity : AuditedEntity
{
    public string StudentUserId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public Guid ProgramId { get; set; }
    public Guid TermId { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal AssignmentAverage { get; set; }
    public bool MandatoryAssignmentsPassed { get; set; }
    public SuccessFinalStatus FinalStatus { get; set; } = SuccessFinalStatus.Successful;
    public string DecidedByUserId { get; set; } = string.Empty;
    public DateTime DecidedAt { get; set; } = DateTime.UtcNow;
    public string? DecisionNotes { get; set; }
}

public enum CertificateStatus { Active = 1, Revoked = 2 }

public sealed class CertificateEntity : AuditedEntity
{
    public string StudentUserId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public Guid ProgramId { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public Guid TermId { get; set; }
    public string TermName { get; set; } = string.Empty;
    public string CertificateNumber { get; set; } = string.Empty;
    public string VerificationCode { get; set; } = string.Empty;
    public DateOnly IssueDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? PdfUrl { get; set; }
    public CertificateStatus Status { get; set; } = CertificateStatus.Active;
    public string? RevocationReason { get; set; }
    public DateTime? RevokedAt { get; set; }
}

public enum ChannelType { Announcement = 1, Group = 2, General = 3 }

public sealed class ChannelEntity : AuditedEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ChannelType Type { get; set; } = ChannelType.General;
    public Guid? GroupId { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public bool IsArchived { get; set; }
    public ICollection<ChannelMessageEntity> Messages { get; set; } = new List<ChannelMessageEntity>();
}

public sealed class ChannelMessageEntity : AuditedEntity
{
    public Guid ChannelId { get; set; }
    public string SenderUserId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public sealed class DirectMessageEntity : AuditedEntity
{
    public string SenderUserId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string ReceiverUserId { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime? ReadAt { get; set; }
}

public enum AnnouncementPriority { Normal = 1, High = 2, Urgent = 3 }

public sealed class AnnouncementEntity : AuditedEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string TargetRole { get; set; } = "All"; // All, Trainee, Instructor, Admin
    public AnnouncementPriority Priority { get; set; } = AnnouncementPriority.Normal;
    public bool IsActive { get; set; } = true;
    public string CreatedByUserId { get; set; } = string.Empty;
}

public sealed class NotificationEntity : AuditedEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info"; // info, success, warning, error
    public string? Link { get; set; }
    public bool IsRead { get; set; }
}

public sealed class SystemSettingEntity : AuditedEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Description { get; set; } = string.Empty;
}

public sealed class Permission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public sealed class RolePermission
{
    public string RoleId { get; set; } = string.Empty;
    public Guid PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}

public sealed class AuditLog
{
    public long Id { get; set; }
    public string? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? Detail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class BootstrapState
{
    public int Id { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public sealed class IdempotencyRecord
{
    public long Id { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public string? ResponseJson { get; set; }
    public int StatusCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
}

public sealed class DomainValidationException(string message) : Exception(message);
