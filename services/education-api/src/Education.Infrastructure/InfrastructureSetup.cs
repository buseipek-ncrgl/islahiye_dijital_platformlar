using Education.Application;
using Education.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Education.Infrastructure;

public static class InfrastructureSetup
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connection = config.GetConnectionString("EducationDb") ?? "Data Source=IslahiyeEducation.db";
        var provider = config["DatabaseProvider"] ?? (connection.Contains(".db") || (connection.Contains("Data Source=") && !connection.Contains("Server=") && !connection.Contains("localdb")) ? "Sqlite" : "SqlServer");

        if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<EducationDbContext>(o => o.UseSqlite(connection));
        }
        else
        {
            services.AddDbContext<EducationDbContext>(o => o.UseSqlServer(connection, sql => sql.EnableRetryOnFailure(3)));
        }

        services.AddIdentity<ApplicationUser, IdentityRole>(o =>
        {
            o.Password.RequiredLength = 8;
            o.Password.RequireDigit = true;
            o.Password.RequireLowercase = true;
            o.Password.RequireUppercase = false;
            o.Password.RequireNonAlphanumeric = false;
            o.Lockout.MaxFailedAccessAttempts = 5;
            o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            o.SignIn.RequireConfirmedAccount = false;
            o.User.RequireUniqueEmail = true;
        }).AddEntityFrameworkStores<EducationDbContext>().AddDefaultTokenProviders();

        return services;
    }

    public static async Task SeedReferenceDataAsync(EducationDbContext db, RoleManager<IdentityRole> roles, UserManager<ApplicationUser>? users = null)
    {
        if (await db.BootstrapStates.AnyAsync(x => x.IsCompleted))
            return;

        // 1. Roles
        string[] roleNames = ["Applicant", "Trainee", "Instructor", "Admin", "SuperAdmin"];
        foreach (var role in roleNames)
        {
            if (!await roles.RoleExistsAsync(role))
                await roles.CreateAsync(new IdentityRole(role));
        }

        // 2. Permissions
        foreach (var key in PermissionKeys.All)
        {
            if (!await db.Permissions.AnyAsync(x => x.Key == key))
                db.Permissions.Add(new Permission { Key = key, Description = key });
        }
        await db.SaveChangesAsync();

        // 3. Role-Permissions
        foreach (var roleName in new[] { "Admin", "SuperAdmin" })
        {
            var role = await roles.FindByNameAsync(roleName);
            if (role is null) continue;
            var keys = roleName == "SuperAdmin" ? PermissionKeys.All : [
                PermissionKeys.ProgramsCreate, PermissionKeys.ProgramsUpdate,
                PermissionKeys.TermsCreate, PermissionKeys.TermsUpdate,
                "applications.read", "applications.decide", "criteria.manage", "enrollments.manage",
                "groups.manage", "sessions.manage", "attendance.audit", "assignments.manage",
                "success.decide", "certificates.issue", "channels.manage", "announcements.manage"
            ];
            foreach (var permission in await db.Permissions.Where(x => keys.Contains(x.Key)).ToListAsync())
            {
                if (!await db.RolePermissions.AnyAsync(x => x.RoleId == role.Id && x.PermissionId == permission.Id))
                    db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
            }
        }
        await db.SaveChangesAsync();

        // 4. Default Seed Users
        if (users != null)
        {
            var seedUsers = new[]
            {
                // SuperAdmin (2)
                (Email: "admin@islahiye.bel.tr", Name: "Hakan Yılmaz", Role: "SuperAdmin", Pass: "Admin123456!"),
                (Email: "superadmin.zeynep@islahiye.bel.tr", Name: "Zeynep Kaya", Role: "SuperAdmin", Pass: "Admin123456!"),
                // Admin (3)
                (Email: "yonetici.selin@islahiye.bel.tr", Name: "Selin Aydın", Role: "Admin", Pass: "Admin123456!"),
                (Email: "yonetici.serkan@islahiye.bel.tr", Name: "Serkan Korkmaz", Role: "Admin", Pass: "Admin123456!"),
                (Email: "yonetici.burcu@islahiye.bel.tr", Name: "Burcu Yıldız", Role: "Admin", Pass: "Admin123456!"),
                // Instructor (5)
                (Email: "egitmen.mehmet@islahiye.bel.tr", Name: "Şef Mehmet Yılmaz", Role: "Instructor", Pass: "Instructor123456!"),
                (Email: "egitmen.murat@islahiye.bel.tr", Name: "Murat Özkan", Role: "Instructor", Pass: "Instructor123456!"),
                (Email: "egitmen.kemal@islahiye.bel.tr", Name: "Kemal Aksoy", Role: "Instructor", Pass: "Instructor123456!"),
                (Email: "egitmen.fatma@islahiye.bel.tr", Name: "Dr. Fatma Yıldırım", Role: "Instructor", Pass: "Instructor123456!"),
                (Email: "egitmen.ayse@islahiye.bel.tr", Name: "Ayşe Demir", Role: "Instructor", Pass: "Instructor123456!"),
                // Trainee (12)
                (Email: "kursiyer.ahmet@islahiye.bel.tr", Name: "Ahmet Kaya", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.fatma@islahiye.bel.tr", Name: "Fatma Şahin", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.mehmet@islahiye.bel.tr", Name: "Mehmet Öztürk", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.elif@islahiye.bel.tr", Name: "Elif Çetin", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.mustafa@islahiye.bel.tr", Name: "Mustafa Demir", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.emine@islahiye.bel.tr", Name: "Emine Koç", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.caner@islahiye.bel.tr", Name: "Caner Yıldız", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.busra@islahiye.bel.tr", Name: "Büşra Kurt", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.serdar@islahiye.bel.tr", Name: "Serdar Aslan", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.zeynep@islahiye.bel.tr", Name: "Zeynep Polat", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.ibrahim@islahiye.bel.tr", Name: "İbrahim Çelik", Role: "Trainee", Pass: "Trainee123456!"),
                (Email: "kursiyer.merve@islahiye.bel.tr", Name: "Merve Doğan", Role: "Trainee", Pass: "Trainee123456!"),
                // Applicant (7)
                (Email: "aday.ali@islahiye.bel.tr", Name: "Ali Çelik", Role: "Applicant", Pass: "Applicant123456!"),
                (Email: "aday.derya@islahiye.bel.tr", Name: "Derya Yılmaz", Role: "Applicant", Pass: "Applicant123456!"),
                (Email: "aday.hasan@islahiye.bel.tr", Name: "Hasan Kılıç", Role: "Applicant", Pass: "Applicant123456!"),
                (Email: "aday.seda@islahiye.bel.tr", Name: "Seda Erdem", Role: "Applicant", Pass: "Applicant123456!"),
                (Email: "aday.burak@islahiye.bel.tr", Name: "Burak Şen", Role: "Applicant", Pass: "Applicant123456!"),
                (Email: "aday.hilal@islahiye.bel.tr", Name: "Hilal Güneş", Role: "Applicant", Pass: "Applicant123456!"),
                (Email: "aday.volkan@islahiye.bel.tr", Name: "Volkan Tekin", Role: "Applicant", Pass: "Applicant123456!"),
                // Visitor (1)
                (Email: "ziyaretci@islahiye-dijital.org", Name: "Ziyaretçi Kullanıcı", Role: "Applicant", Pass: "Visitor123456!")
            };

            foreach (var (email, name, role, pass) in seedUsers)
            {
                var existingUser = await users.FindByEmailAsync(email);
                if (existingUser is null)
                {
                    var user = new ApplicationUser { UserName = email, Email = email, DisplayName = name, EmailConfirmed = true };
                    var result = await users.CreateAsync(user, pass);
                    if (result.Succeeded)
                    {
                        await users.AddToRoleAsync(user, role);
                        if (role == "SuperAdmin") await users.AddToRoleAsync(user, "Admin");
                    }
                }
            }
        }

        // 5. Default Programs & Terms
        if (!await db.Programs.AnyAsync())
        {
            var p1 = new EducationProgram(
                "İslahiye Gastronomi ve Mutfak Sanatları",
                "islahiye-gastronomi-ve-mutfak-sanatlari",
                "Geleneksel İslahiye mutfağı, yerel gastronomi reçeteleri, hijyen ve modern pişirme teknikleri.",
                "Gastronomiye ilgi duyan, yerel mutfak kültürünü öğrenmek ve istihdam edilmek isteyen tüm vatandaşlar.",
                "En az ilköğretim mezunu olmak.",
                "İslahiye yöresel yemeklerini standart reçetelerle hazırlayabilme, HACCP ve gıda güvenliği kurallarını uygulama."
            );
            p1.ChangeStatus(PublicationStatus.Published);
            db.Programs.Add(p1);

            var p2 = new EducationProgram(
                "Yöresel Baharat ve Biber İşleme Uzmanlığı",
                "yoresel-baharat-ve-biber-isleme",
                "Tescilli İslahiye biberi yetiştiriciliği, kurutma, öğütme, paketleme ve gıda standartları eğitimi.",
                "Tarımsal üretim ve baharat işletmeciliği yapan üreticiler ile sektöre girmek isteyen adaylar.",
                "Temel tarım ve gıda ilgisi.",
                "Tescilli İslahiye biberinin hasat sonrası işleme tekniklerini, hijyen ve kalite standartlarını uygulama."
            );
            p2.ChangeStatus(PublicationStatus.Published);
            db.Programs.Add(p2);

            var p3 = new EducationProgram(
                "Tarım Kooperatifçiliği ve Dijital Pazarlama",
                "tarim-kooperatifi-dijital-pazarlama",
                "Yerel tarım üreticileri için kooperatif örgütlenmesi, e-ticaret platformları ve dijital satış yönetimi.",
                "Kooperatif ortakları, kadın üreticiler ve tarımsal işletme sahipleri.",
                "Temel bilgisayar ve akıllı telefon kullanımı.",
                "Kooperatif yönetim mevzuatı, sosyal medya üzerinden ürün pazarlama ve kargo/lojistik süreç yönetimi."
            );
            p3.ChangeStatus(PublicationStatus.Published);
            db.Programs.Add(p3);

            await db.SaveChangesAsync();

            // Add Terms
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var term1 = new EducationTerm(
                p1.Id,
                "2026 Güz Dönemi",
                today.AddDays(15),
                today.AddDays(75),
                DateTime.UtcNow.AddDays(-30),
                DateTime.UtcNow.AddDays(10),
                25
            );
            term1.ChangeStatus(PublicationStatus.Published);
            db.Terms.Add(term1);

            var term2 = new EducationTerm(
                p2.Id,
                "2026 Biber Hasat Dönemi",
                today.AddDays(20),
                today.AddDays(60),
                DateTime.UtcNow.AddDays(-20),
                DateTime.UtcNow.AddDays(12),
                30
            );
            term2.ChangeStatus(PublicationStatus.Published);
            db.Terms.Add(term2);

            var term3 = new EducationTerm(
                p3.Id,
                "2026 Dijital Kooperatif Dönemi",
                today.AddDays(25),
                today.AddDays(85),
                DateTime.UtcNow.AddDays(-15),
                DateTime.UtcNow.AddDays(14),
                20
            );
            term3.ChangeStatus(PublicationStatus.Published);
            db.Terms.Add(term3);

            await db.SaveChangesAsync();

            // Add Criteria Set
            var cs = new CriteriaSetEntity { ProgramId = p1.Id, TermId = term1.Id, Version = 1, IsActive = true };
            db.CriteriaSets.Add(cs);
            await db.SaveChangesAsync();

            db.Criteria.AddRange(
                new CriterionEntity { CriteriaSetId = cs.Id, Code = "IKAMET", Title = "İslahiye İkamet Durumu", Category = "Demografik", Weight = 30, MaxScore = 100, OrderIndex = 1 },
                new CriterionEntity { CriteriaSetId = cs.Id, Code = "DENEYIM", Title = "Sektörel / Mutfak Deneyimi", Category = "Yetkinlik", Weight = 30, MaxScore = 100, OrderIndex = 2 },
                new CriterionEntity { CriteriaSetId = cs.Id, Code = "EGITIM", Title = "Eğitim Düzeyi Uygunluğu", Category = "Genel", Weight = 20, MaxScore = 100, OrderIndex = 3 },
                new CriterionEntity { CriteriaSetId = cs.Id, Code = "MOTIVASYON", Title = "Gerekçe ve İstihdam Hedefi", Category = "Nitelik", Weight = 20, MaxScore = 100, OrderIndex = 4 }
            );

            // Add Default CourseGroup
            var group1 = new CourseGroupEntity
            {
                ProgramId = p1.Id,
                TermId = term1.Id,
                Name = "Grup A — Sabah Oturumu",
                Code = "GSM-2026-A",
                Classroom = "Uygulama Mutfağı 1",
                Capacity = 25,
                InstructorName = "Şef Mehmet Yılmaz",
                Status = PublicationStatus.Published
            };
            db.Groups.Add(group1);
            await db.SaveChangesAsync();

            // Add CourseSessions
            for (int i = 1; i <= 6; i++)
            {
                db.CourseSessions.Add(new CourseSessionEntity
                {
                    GroupId = group1.Id,
                    Title = $"Modül {i}: Geleneksel Gastronomi ve Pişirme Teknikleri #{i}",
                    Date = today.AddDays(15 + (i * 7)),
                    StartTime = "09:00",
                    EndTime = "13:00",
                    Classroom = "Uygulama Mutfağı 1",
                    Status = i <= 2 ? SessionStatus.Completed : SessionStatus.Scheduled,
                    Notes = i <= 2 ? "Oturum başarıyla tamamlandı, manuel yoklama alındı." : "Planlandı."
                });
            }

            // Add Assignment
            db.Assignments.Add(new AssignmentEntity
            {
                GroupId = group1.Id,
                Title = "Ödev 1: Geleneksel İslahiye Biberi Kurutma ve Fermantasyon Raporu",
                Description = "Yöresel biber işleme adımlarını hijyen standartlarına göre açıklayan en az 2 sayfalık bireysel rapor.",
                DueDate = DateTime.UtcNow.AddDays(25),
                MaxScore = 100,
                Weight = 25,
                IsMandatory = true
            });

            // Add Sample Application
            var app1 = new ApplicationEntity
            {
                ApplicationNumber = "ISL-2026-0001",
                ApplicantUserId = "demo-applicant-ali",
                ProgramId = p1.Id,
                TermId = term1.Id,
                FullName = "Ali Çelik",
                Email = "aday.ali@islahiye.bel.tr",
                Phone = "0532 555 1234",
                BirthDate = "1995-04-12",
                EducationLevel = "Ön Lisans",
                Occupation = "Aşçı Yardımcısı",
                ExperienceYears = 2,
                Motivation = "İslahiye yerel mutfağını derinlemesine öğrenmek ve profesyonel sertifika alarak belediye tesislerinde istihdam edilmek istiyorum.",
                Address = "Cumhuriyet Mah. Atatürk Cad. No:14 İslahiye / Gaziantep",
                SpecialNeeds = "Yok",
                Status = ApplicationStatus.Submitted,
                SubmittedAt = DateTime.UtcNow.AddDays(-2),
                Score = 85.0m
            };
            db.Applications.Add(app1);

            // Add Sample Certificate
            db.Certificates.Add(new CertificateEntity
            {
                StudentUserId = "kursiyer.ahmet@islahiye.bel.tr",
                StudentName = "Ahmet Kaya",
                ProgramId = p1.Id,
                ProgramName = p1.Name,
                TermId = term1.Id,
                TermName = term1.Name,
                CertificateNumber = "ISL-SRT-2026-0001",
                VerificationCode = "ISL-2026-CERT-001",
                IssueDate = today.AddDays(-5),
                Status = CertificateStatus.Active
            });

            // Add Channels
            db.Channels.AddRange(
                new ChannelEntity { Name = "Genel Duyurular", Description = "Tüm eğitim platformu genel bilgilendirme kanalı", Type = ChannelType.Announcement, CreatedByUserId = "system" },
                new ChannelEntity { Name = "Mutfak Sanatları 2026/1", Description = "Mutfak sanatları kursiyer ve eğitmen ortak çalışma grubu", Type = ChannelType.Group, GroupId = group1.Id, CreatedByUserId = "system" },
                new ChannelEntity { Name = "Eğitmen Koordinasyonu", Description = "Eğitmenler ve eğitim koordinatörleri resmi iletişim kanalı", Type = ChannelType.General, CreatedByUserId = "system" }
            );

            // Add System Settings
            db.SystemSettings.AddRange(
                new SystemSettingEntity { Key = "AttendanceMinPercentage", Value = "80", Category = "Akademik", Description = "Sertifika hak kazanımı için zorunlu asgari devam oranı (%)" },
                new SystemSettingEntity { Key = "AssignmentPassGrade", Value = "70", Category = "Akademik", Description = "Sertifika hak kazanımı için asgari ödev ortalaması (100 üzerinden)" },
                new SystemSettingEntity { Key = "MaxClassCapacity", Value = "30", Category = "Operasyonel", Description = "Bir derslikte açılabilecek azami kursiyer kontenjanı" },
                new SystemSettingEntity { Key = "SystemInstitutionName", Value = "İslahiye Belediyesi Dijital Eğitim Platformu", Category = "Kurumsal", Description = "Platform resmî kurum unvanı" }
            );

            // Add Announcement
            db.Announcements.Add(new AnnouncementEntity
            {
                Title = "2026 Güz Dönemi Eğitim Başvuruları Başladı",
                Content = "İslahiye Belediyesi bünyesinde açılan Gastronomi, Baharat İşleme ve Kooperatifçilik eğitimleri için başvurular açılmıştır.",
                TargetRole = "All",
                Priority = AnnouncementPriority.High,
                CreatedByUserId = "system"
            });

            await db.SaveChangesAsync();
        }

        if (!await db.BootstrapStates.AnyAsync())
        {
            db.BootstrapStates.Add(new BootstrapState { IsCompleted = true, CompletedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }
    }
}
