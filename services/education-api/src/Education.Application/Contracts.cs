using Education.Domain;

namespace Education.Application;

public sealed record RegisterRequest(string Email, string Password, string DisplayName);
public sealed record LoginRequest(string Email, string Password);
public sealed record UserResponse(string Id, string Email, string DisplayName, IReadOnlyList<string> Roles, IReadOnlyList<string> Permissions);

public sealed record ProgramWriteRequest(string Name, string Slug, string Description, string TargetAudience, string Prerequisites, string LearningOutcomes, PublicationStatus Status, string? RowVersion);
public sealed record TermWriteRequest(string Name, DateOnly StartDate, DateOnly EndDate, DateTime ApplicationStartAt, DateTime ApplicationEndAt, int Capacity, PublicationStatus Status, string? RowVersion);
public sealed record TermResponse(Guid Id, Guid ProgramId, string Name, DateOnly StartDate, DateOnly EndDate, DateTime ApplicationStartAt, DateTime ApplicationEndAt, int Capacity, PublicationStatus Status, string RowVersion);
public sealed record ProgramResponse(Guid Id, string Name, string Slug, string Description, string TargetAudience, string Prerequisites, string LearningOutcomes, PublicationStatus Status, string RowVersion, IReadOnlyList<TermResponse> Terms);

// Applications
public sealed record ApplicationWriteRequest(
    Guid ProgramId,
    Guid TermId,
    string FullName,
    string Email,
    string Phone,
    string BirthDate,
    string EducationLevel,
    string Occupation,
    int ExperienceYears,
    string Motivation,
    string Address,
    string SpecialNeeds,
    bool SubmitNow = true
);

public sealed record ApplicationDocumentDto(
    Guid Id,
    string DocumentType,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    DocumentVerificationStatus Status,
    DateTime? VerifiedAt
);

public sealed record ApplicationEvaluationDto(
    Guid Id,
    string EvaluatedByUserId,
    decimal TotalScore,
    string Recommendation,
    string EvaluationNotes,
    DateTime EvaluatedAt
);

public sealed record ApplicationResponse(
    Guid Id,
    string ApplicationNumber,
    string ApplicantUserId,
    Guid ProgramId,
    string ProgramName,
    Guid TermId,
    string TermName,
    string FullName,
    string Email,
    string Phone,
    string BirthDate,
    string EducationLevel,
    string Occupation,
    int ExperienceYears,
    string Motivation,
    string Address,
    string SpecialNeeds,
    ApplicationStatus Status,
    DateTime? SubmittedAt,
    string? AdminNotes,
    string? RejectionReason,
    decimal Score,
    IReadOnlyList<ApplicationDocumentDto> Documents,
    IReadOnlyList<ApplicationEvaluationDto> Evaluations,
    DateTime CreatedAt
);

public sealed record ApplicationStatusUpdateRequest(
    ApplicationStatus Status,
    string? AdminNotes,
    string? RejectionReason,
    string? InternalDecisionNote
);

public sealed record ApplicationEvaluationRequest(
    decimal TotalScore,
    string Recommendation,
    string EvaluationNotes
);

// Groups
public sealed record GroupWriteRequest(
    Guid ProgramId,
    Guid TermId,
    string Name,
    string Code,
    string Classroom,
    int Capacity,
    string? InstructorUserId,
    string? InstructorName,
    PublicationStatus Status = PublicationStatus.Published
);

public sealed record GroupResponse(
    Guid Id,
    Guid ProgramId,
    string ProgramName,
    Guid TermId,
    string TermName,
    string Name,
    string Code,
    string Classroom,
    int Capacity,
    string? InstructorUserId,
    string? InstructorName,
    PublicationStatus Status,
    int EnrolledCount,
    DateTime CreatedAt
);

public sealed record AssignStudentRequest(string StudentUserId, string StudentName, string StudentEmail);

// Enrollments
public sealed record EnrollmentWriteRequest(
    Guid? ApplicationId,
    string StudentUserId,
    string StudentName,
    string StudentEmail,
    Guid ProgramId,
    Guid TermId,
    Guid? GroupId
);

public sealed record EnrollmentResponse(
    Guid Id,
    Guid? ApplicationId,
    string StudentUserId,
    string StudentName,
    string StudentEmail,
    Guid ProgramId,
    string ProgramName,
    Guid TermId,
    string TermName,
    Guid? GroupId,
    string? GroupName,
    string EnrollmentNumber,
    EnrollmentStatus Status,
    DateTime EnrolledAt,
    DateTime? CompletedAt
);

public sealed record EnrollmentStatusUpdateRequest(EnrollmentStatus Status);

// Sessions & Attendance
public sealed record SessionWriteRequest(
    Guid GroupId,
    string Title,
    DateOnly Date,
    string StartTime,
    string EndTime,
    string Classroom,
    SessionStatus Status = SessionStatus.Scheduled,
    string? Notes = null
);

public sealed record AttendanceRecordResponse(
    Guid Id,
    Guid SessionId,
    string StudentUserId,
    string StudentName,
    AttendanceStatus Status,
    DateTime RecordedAt,
    string? Notes
);

public sealed record SessionResponse(
    Guid Id,
    Guid GroupId,
    string GroupName,
    string Title,
    DateOnly Date,
    string StartTime,
    string EndTime,
    string Classroom,
    SessionStatus Status,
    string? Notes,
    IReadOnlyList<AttendanceRecordResponse> AttendanceRecords
);

public sealed record AttendanceItemDto(string StudentUserId, AttendanceStatus Status, string? Notes);
public sealed record AttendanceSaveRequest(IReadOnlyList<AttendanceItemDto> Records);

// Assignments & Submissions
public sealed record AssignmentWriteRequest(
    Guid GroupId,
    string Title,
    string Description,
    DateTime DueDate,
    int MaxScore = 100,
    int Weight = 20,
    bool IsMandatory = true
);

public sealed record AssignmentSubmissionResponse(
    Guid Id,
    Guid AssignmentId,
    string StudentUserId,
    string StudentName,
    string SubmissionText,
    string? AttachmentPath,
    DateTime SubmittedAt,
    decimal? Score,
    string? Feedback,
    string? EvaluatedByUserId,
    DateTime? EvaluatedAt,
    SubmissionStatus Status,
    int RevisionNumber
);

public sealed record AssignmentResponse(
    Guid Id,
    Guid GroupId,
    string GroupName,
    string Title,
    string Description,
    DateTime DueDate,
    int MaxScore,
    int Weight,
    bool IsMandatory,
    IReadOnlyList<AssignmentSubmissionResponse> Submissions,
    DateTime CreatedAt
);

public sealed record AssignmentSubmissionRequest(string SubmissionText, string? AttachmentPath);
public sealed record AssignmentGradeRequest(decimal Score, string Feedback, SubmissionStatus Status = SubmissionStatus.Graded);

// Success Decisions
public sealed record SuccessDecisionWriteRequest(
    string StudentUserId,
    string StudentName,
    Guid ProgramId,
    Guid TermId,
    decimal AttendanceRate,
    decimal AssignmentAverage,
    bool MandatoryAssignmentsPassed,
    SuccessFinalStatus FinalStatus,
    string? DecisionNotes
);

public sealed record SuccessDecisionResponse(
    Guid Id,
    string StudentUserId,
    string StudentName,
    Guid ProgramId,
    string ProgramName,
    Guid TermId,
    string TermName,
    decimal AttendanceRate,
    decimal AssignmentAverage,
    bool MandatoryAssignmentsPassed,
    SuccessFinalStatus FinalStatus,
    string DecidedByUserId,
    DateTime DecidedAt,
    string? DecisionNotes
);

// Certificates
public sealed record CertificateIssueRequest(
    string StudentUserId,
    string StudentName,
    Guid ProgramId,
    Guid TermId,
    DateOnly IssueDate,
    DateOnly? ExpiryDate = null
);

public sealed record CertificateResponse(
    Guid Id,
    string StudentUserId,
    string StudentName,
    Guid ProgramId,
    string ProgramName,
    Guid TermId,
    string TermName,
    string CertificateNumber,
    string VerificationCode,
    DateOnly IssueDate,
    DateOnly? ExpiryDate,
    string? PdfUrl,
    CertificateStatus Status,
    string? RevocationReason,
    DateTime? RevokedAt
);

public sealed record CertificateVerifyResponse(
    bool IsValid,
    string? StudentName,
    string? ProgramName,
    string? TermName,
    string? CertificateNumber,
    string? VerificationCode,
    DateOnly? IssueDate,
    CertificateStatus? Status,
    string? Message
);

// Channels & Messages
public sealed record ChannelWriteRequest(
    string Name,
    string Description,
    ChannelType Type,
    Guid? GroupId
);

public sealed record ChannelMessageResponse(
    Guid Id,
    Guid ChannelId,
    string SenderUserId,
    string SenderName,
    string Content,
    DateTime CreatedAt
);

public sealed record ChannelResponse(
    Guid Id,
    string Name,
    string Description,
    ChannelType Type,
    Guid? GroupId,
    string CreatedByUserId,
    bool IsArchived,
    int MessageCount,
    DateTime CreatedAt
);

public sealed record ChannelMessageRequest(string Content);

public sealed record DirectMessageRequest(
    string ReceiverUserId,
    string ReceiverName,
    string Content
);

public sealed record DirectMessageResponse(
    Guid Id,
    string SenderUserId,
    string SenderName,
    string ReceiverUserId,
    string ReceiverName,
    string Content,
    DateTime CreatedAt,
    DateTime? ReadAt
);

// Announcements & Notifications
public sealed record AnnouncementWriteRequest(
    string Title,
    string Content,
    string TargetRole,
    AnnouncementPriority Priority,
    bool IsActive
);

public sealed record AnnouncementResponse(
    Guid Id,
    string Title,
    string Content,
    string TargetRole,
    AnnouncementPriority Priority,
    bool IsActive,
    string CreatedByUserId,
    DateTime CreatedAt
);

public sealed record NotificationResponse(
    Guid Id,
    string UserId,
    string Title,
    string Message,
    string Type,
    string? Link,
    bool IsRead,
    DateTime CreatedAt
);

// Users & Settings
public sealed record UserDetailResponse(
    string Id,
    string Email,
    string DisplayName,
    bool IsActive,
    IReadOnlyList<string> Roles,
    DateTime CreatedAt
);

public sealed record UserCreateRequest(
    string Email,
    string Password,
    string DisplayName,
    string Role
);

public sealed record UserUpdateRequest(
    string DisplayName,
    bool IsActive,
    IReadOnlyList<string> Roles
);

public sealed record SystemSettingWriteRequest(
    string Key,
    string Value,
    string Category,
    string Description
);

public sealed record SystemSettingResponse(
    Guid Id,
    string Key,
    string Value,
    string Category,
    string Description,
    DateTime UpdatedAt
);

public static class PermissionKeys
{
    public const string ProgramsCreate = "programs.create";
    public const string ProgramsUpdate = "programs.update";
    public const string TermsCreate = "terms.create";
    public const string TermsUpdate = "terms.update";
    public static readonly string[] All = [
        ProgramsCreate, ProgramsUpdate, TermsCreate, TermsUpdate,
        "applications.read", "applications.decide", "criteria.manage", "enrollments.manage",
        "groups.manage", "sessions.manage", "attendance.take", "attendance.correct",
        "attendance.audit", "assignments.manage", "assignments.evaluate", "success.decide",
        "certificates.issue", "certificates.revoke", "channels.manage", "announcements.manage",
        "users.manage", "roles.manage", "settings.manage", "audit.read"
    ];
}
