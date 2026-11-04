# Education API

.NET 10 / ASP.NET Core / EF Core 10 / SQL Server tabanlı eğitim backend'i.

Bağlantı dizesi kaynak kodda tutulmaz:

```powershell
dotnet user-secrets set "ConnectionStrings:EducationDb" "Server=(localdb)\\MSSQLLocalDB;Database=IslahiyeEducationDb;Trusted_Connection=True;TrustServerCertificate=True" --project src/Education.Api
dotnet run --project src/Education.Api -- --migrate --seed-system
```

İlk süper yönetici yalnızca etkileşimli yerel terminalden oluşturulur. Önce PowerShell ile `services/education-api` dizinine geçin ve hedef SQL Server'ın erişilebilir, migration'ların uygulanmış olduğundan emin olun. Parola argüman, environment variable veya dosyadan alınmaz:

```powershell
$env:ASPNETCORE_ENVIRONMENT='Installation'
$env:Bootstrap__Enabled='true'
$env:ConnectionStrings__EducationDb='<güvenli SQL Server bağlantısı>'
dotnet run --project src/Education.Api -- --bootstrap-superadmin
```

Komut parola istemeden önce SQL bağlantısını, mevcut `SuperAdmin` üyeliğini ve `BootstrapStates` tek-kullanım durumunu denetler. Bir SuperAdmin veya tamamlanmış bootstrap kaydı varsa durur. E-postayı terminalden, parolayı ekrana yansıtmadan iki kez ister. Başarı mesajı parola veya hassas veri içermez. Yetkili kişi başarı mesajını görmeden kurulum tamamlanmış sayılmaz. Normal uygulama başlangıcı migration çalıştırmaz.

`--seed-e2e-admin`, `--verify-e2e` ve `--cleanup-e2e` yalnız otomatik test altyapısı içindir. Bunlar sadece `Testing` ortamında ve `IslahiyeEducationE2E_*` adlı izole veritabanlarında çalışır; gerçek SuperAdmin bootstrap sürecinin yerine geçmez.
