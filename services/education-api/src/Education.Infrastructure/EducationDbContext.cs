using Education.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Education.Infrastructure;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class EducationDbContext(DbContextOptions<EducationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole, string>(options)
{
    public DbSet<EducationProgram> Programs => Set<EducationProgram>();
    public DbSet<EducationTerm> Terms => Set<EducationTerm>();
    public DbSet<ApplicationEntity> Applications => Set<ApplicationEntity>();
    public DbSet<ApplicationDocumentEntity> ApplicationDocuments => Set<ApplicationDocumentEntity>();
    public DbSet<CriteriaSetEntity> CriteriaSets => Set<CriteriaSetEntity>();
    public DbSet<CriterionEntity> Criteria => Set<CriterionEntity>();
    public DbSet<ApplicationEvaluationEntity> ApplicationEvaluations => Set<ApplicationEvaluationEntity>();
    public DbSet<CourseGroupEntity> Groups => Set<CourseGroupEntity>();
    public DbSet<EnrollmentEntity> Enrollments => Set<EnrollmentEntity>();
    public DbSet<CourseSessionEntity> CourseSessions => Set<CourseSessionEntity>();
    public DbSet<AttendanceRecordEntity> AttendanceRecords => Set<AttendanceRecordEntity>();
    public DbSet<AssignmentEntity> Assignments => Set<AssignmentEntity>();
    public DbSet<AssignmentSubmissionEntity> AssignmentSubmissions => Set<AssignmentSubmissionEntity>();
    public DbSet<SuccessDecisionEntity> SuccessDecisions => Set<SuccessDecisionEntity>();
    public DbSet<CertificateEntity> Certificates => Set<CertificateEntity>();
    public DbSet<ChannelEntity> Channels => Set<ChannelEntity>();
    public DbSet<ChannelMessageEntity> ChannelMessages => Set<ChannelMessageEntity>();
    public DbSet<DirectMessageEntity> DirectMessages => Set<DirectMessageEntity>();
    public DbSet<AnnouncementEntity> Announcements => Set<AnnouncementEntity>();
    public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();
    public DbSet<SystemSettingEntity> SystemSettings => Set<SystemSettingEntity>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<BootstrapState> BootstrapStates => Set<BootstrapState>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<ApplicationUser>(e =>
        {
            e.Property(x => x.DisplayName).HasMaxLength(160).IsRequired();
            e.HasIndex(x => x.NormalizedEmail).IsUnique();
        });

        b.Entity<EducationProgram>(e =>
        {
            e.ToTable("Programs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Description).HasMaxLength(4000);
            e.Property(x => x.TargetAudience).HasMaxLength(2000);
            e.Property(x => x.Prerequisites).HasMaxLength(2000);
            e.Property(x => x.LearningOutcomes).HasMaxLength(4000);
            if (Database.IsSqlite()) e.Property(x => x.RowVersion).IsConcurrencyToken();
            else e.Property(x => x.RowVersion).IsRowVersion();
        });

        b.Entity<EducationTerm>(e =>
        {
            e.ToTable("Terms");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            if (Database.IsSqlite()) e.Property(x => x.RowVersion).IsConcurrencyToken();
            else e.Property(x => x.RowVersion).IsRowVersion();
            e.HasIndex(x => new { x.ProgramId, x.Name }).IsUnique();
            e.HasIndex(x => new { x.Status, x.ApplicationEndAt });
            e.HasOne(x => x.Program).WithMany(x => x.Terms).HasForeignKey(x => x.ProgramId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<ApplicationEntity>(e =>
        {
            e.ToTable("Applications");
            e.HasKey(x => x.Id);
            e.Property(x => x.ApplicationNumber).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.ApplicationNumber).IsUnique();
            e.Property(x => x.FullName).HasMaxLength(160).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(50);
            e.Property(x => x.EducationLevel).HasMaxLength(100);
            e.Property(x => x.Occupation).HasMaxLength(100);
            e.Property(x => x.Motivation).HasMaxLength(3000);
            e.Property(x => x.Score).HasPrecision(18, 2);
            e.HasIndex(x => new { x.ApplicantUserId, x.ProgramId, x.TermId });
            e.HasIndex(x => x.Status);
            e.HasMany(x => x.Documents).WithOne().HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Evaluations).WithOne().HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ApplicationDocumentEntity>(e =>
        {
            e.ToTable("ApplicationDocuments");
            e.HasKey(x => x.Id);
            e.Property(x => x.DocumentType).HasMaxLength(100);
            e.Property(x => x.FileName).HasMaxLength(260);
            e.Property(x => x.ContentType).HasMaxLength(100);
        });

        b.Entity<CriteriaSetEntity>(e =>
        {
            e.ToTable("CriteriaSets");
            e.HasKey(x => x.Id);
            e.HasMany(x => x.Criteria).WithOne().HasForeignKey(x => x.CriteriaSetId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CriterionEntity>(e =>
        {
            e.ToTable("Criteria");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasMaxLength(50);
            e.Property(x => x.Title).HasMaxLength(200);
            e.Property(x => x.Category).HasMaxLength(100);
        });

        b.Entity<ApplicationEvaluationEntity>(e =>
        {
            e.ToTable("ApplicationEvaluations");
            e.HasKey(x => x.Id);
            e.Property(x => x.TotalScore).HasPrecision(18, 2);
            e.Property(x => x.Recommendation).HasMaxLength(100);
            e.Property(x => x.EvaluationNotes).HasMaxLength(2000);
        });

        b.Entity<CourseGroupEntity>(e =>
        {
            e.ToTable("CourseGroups");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.Property(x => x.Classroom).HasMaxLength(100);
            e.HasIndex(x => new { x.TermId, x.Code }).IsUnique();
            e.HasMany(x => x.Students).WithOne().HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Sessions).WithOne().HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Assignments).WithOne().HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<EnrollmentEntity>(e =>
        {
            e.ToTable("Enrollments");
            e.HasKey(x => x.Id);
            e.Property(x => x.EnrollmentNumber).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.EnrollmentNumber).IsUnique();
            e.HasIndex(x => new { x.StudentUserId, x.TermId }).IsUnique();
            e.Property(x => x.StudentName).HasMaxLength(160);
            e.Property(x => x.StudentEmail).HasMaxLength(200);
        });

        b.Entity<CourseSessionEntity>(e =>
        {
            e.ToTable("CourseSessions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Classroom).HasMaxLength(100);
            e.HasMany(x => x.AttendanceRecords).WithOne().HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<AttendanceRecordEntity>(e =>
        {
            e.ToTable("AttendanceRecords");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.SessionId, x.StudentUserId }).IsUnique();
        });

        b.Entity<AssignmentEntity>(e =>
        {
            e.ToTable("Assignments");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Description).HasMaxLength(4000);
            e.HasMany(x => x.Submissions).WithOne().HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<AssignmentSubmissionEntity>(e =>
        {
            e.ToTable("AssignmentSubmissions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Score).HasPrecision(18, 2);
            e.Property(x => x.Feedback).HasMaxLength(2000);
            e.Property(x => x.SubmissionText).HasMaxLength(4000);
            e.HasIndex(x => new { x.AssignmentId, x.StudentUserId, x.RevisionNumber });
        });

        b.Entity<SuccessDecisionEntity>(e =>
        {
            e.ToTable("SuccessDecisions");
            e.HasKey(x => x.Id);
            e.Property(x => x.AttendanceRate).HasPrecision(18, 2);
            e.Property(x => x.AssignmentAverage).HasPrecision(18, 2);
            e.HasIndex(x => new { x.StudentUserId, x.TermId }).IsUnique();
        });

        b.Entity<CertificateEntity>(e =>
        {
            e.ToTable("Certificates");
            e.HasKey(x => x.Id);
            e.Property(x => x.CertificateNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.VerificationCode).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.CertificateNumber).IsUnique();
            e.HasIndex(x => x.VerificationCode).IsUnique();
        });

        b.Entity<ChannelEntity>(e =>
        {
            e.ToTable("Channels");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500);
            e.HasMany(x => x.Messages).WithOne().HasForeignKey(x => x.ChannelId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ChannelMessageEntity>(e =>
        {
            e.ToTable("ChannelMessages");
            e.HasKey(x => x.Id);
            e.Property(x => x.SenderName).HasMaxLength(160);
            e.Property(x => x.Content).HasMaxLength(4000).IsRequired();
            e.HasIndex(x => x.CreatedAt);
        });

        b.Entity<DirectMessageEntity>(e =>
        {
            e.ToTable("DirectMessages");
            e.HasKey(x => x.Id);
            e.Property(x => x.SenderName).HasMaxLength(160);
            e.Property(x => x.ReceiverName).HasMaxLength(160);
            e.Property(x => x.Content).HasMaxLength(4000).IsRequired();
            e.HasIndex(x => new { x.SenderUserId, x.ReceiverUserId });
            e.HasIndex(x => x.CreatedAt);
        });

        b.Entity<AnnouncementEntity>(e =>
        {
            e.ToTable("Announcements");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Content).HasMaxLength(4000).IsRequired();
            e.Property(x => x.TargetRole).HasMaxLength(50);
            e.HasIndex(x => x.CreatedAt);
        });

        b.Entity<NotificationEntity>(e =>
        {
            e.ToTable("Notifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Message).HasMaxLength(1000).IsRequired();
            e.Property(x => x.Type).HasMaxLength(50);
            e.HasIndex(x => new { x.UserId, x.IsRead });
        });

        b.Entity<SystemSettingEntity>(e =>
        {
            e.ToTable("SystemSettings");
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Key).IsUnique();
            e.Property(x => x.Value).HasMaxLength(2000);
            e.Property(x => x.Category).HasMaxLength(100);
        });

        b.Entity<Permission>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Key).IsUnique();
            e.Property(x => x.Description).HasMaxLength(300);
        });

        b.Entity<RolePermission>(e =>
        {
            e.HasKey(x => new { x.RoleId, x.PermissionId });
            e.HasOne<IdentityRole>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Permission).WithMany().HasForeignKey(x => x.PermissionId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Action).HasMaxLength(100);
            e.Property(x => x.EntityType).HasMaxLength(100);
            e.HasIndex(x => x.CreatedAt);
        });

        b.Entity<BootstrapState>(e => e.HasKey(x => x.Id));

        b.Entity<IdempotencyRecord>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ActorId).HasMaxLength(450).IsRequired();
            e.Property(x => x.Operation).HasMaxLength(100).IsRequired();
            e.Property(x => x.Key).HasMaxLength(200).IsRequired();
            e.Property(x => x.RequestHash).HasMaxLength(64).IsRequired();
            e.HasIndex(x => new { x.ActorId, x.Operation, x.Key }).IsUnique();
            e.HasIndex(x => x.ExpiresAt);
        });
    }
}
