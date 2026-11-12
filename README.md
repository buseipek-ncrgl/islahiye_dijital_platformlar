# İslahiye Dijital Platformlar — Monorepo

[![CI - Build & Type Check](https://github.com/buseipek-ncrgl/islahiye_dijital_platformlar/actions/workflows/ci.yml/badge.svg)](https://github.com/buseipek-ncrgl/islahiye_dijital_platformlar/actions/workflows/ci.yml)

İslahiye Ticaret Odası bünyesinde yürütülen yerel kalkınma, kültürel mirasın korunması ve nitelikli mesleki/dijital eğitim hamlelerini desteklemek üzere tasarlanmış iki bağımsız yazılım ürününü barındıran kurumsal monorepo çalışma alanıdır.

---

## 1. Proje Mimarisi ve Ürünler

Bu depoda tek bir npm workspace çatısı altında çalışan iki bağımsız React/TypeScript frontend uygulaması ve bunlara hizmet veren iki bağımsız .NET 9 C# Web API arka uç servisi bulunmaktadır:

```
islahiye-dijital-platformlar/
├── .github/
│   └── workflows/          # GitHub Actions sürekli entegrasyon (CI) iş akışları
├── apps/
│   ├── gastronomi/         # 1. Frontend: İslahiye Lezzet Atlası (Kültür & Gastronomi Portalı + CMS)
│   └── egitim/             # 2. Frontend: İslahiye Ticaret Odası Eğitim Portalı (Akademi & Kursiyer Yönetimi)
├── services/
│   ├── gastronomy-api/     # 1. Backend: İslahiye Lezzet Atlası .NET 9 Web API (Clean Architecture)
│   └── education-api/      # 2. Backend: İslahiye Eğitim Portalı .NET 9 Web API & SQL Server (Idempotent API)
├── packages/
│   └── ui/                 # Paylaşımlı nötr bileşenler (opsiyonel ortak alan)
├── package.json            # Monorepo çalışma alanı (npm workspaces) yapılandırması
├── .gitignore              # Üretim kodu ve yerel geliştirme arşivini ayıran kural seti
└── README.md               # Ana monorepo dokümantasyonu
```

### Ürün Karşılaştırma Özeti

| Kriter | İslahiye Lezzet Atlası (`apps/gastronomi`) | İslahiye Eğitim Portalı (`apps/egitim`) |
|---|---|---|
| **Temel Amaç** | İslahiye mutfak mirasını, coğrafi işaretli ürünleri ve zanaatkârları belgelemek ve tanıtmak | Mesleki, dijital ve girişimcilik eğitimlerini uçtan uca planlamak, yürütmek ve sertifikalandırmak |
| **Kullanıcı Rolleri** | Ziyaretçi, İçerik Editörü, Yayın Yetkilisi | Aday, Kursiyer, Eğitmen, Yönetici, Süper Admin |
| **Görsel Tasarım Dili** | Sıcak Editoryal Premium (`#203B31`, `#BA855E`, `#F6F2E9`, Cormorant Garamond, Manrope) | Derin Çivit & Arduvaz Kurumsal (`#0F172A`, `#1E3A8A`, `#2563EB`, `#F8FAFC`, Inter) |
| **Öne Çıkan Özellikler** | Çift modlu harita, tarif atölyesi, usta profilleri, CMS yayın masası | Kriter puanlama, manuel yoklama, ödev revizyonu, QR/PDF sertifika, yetki matrisi |
| **Bağımsız Çalışma Portu** | `http://localhost:5173` | `http://localhost:5174` (veya 5175) |

---

## 2. Uygulamaların Kapsamı

### 2.1. İslahiye Lezzet Atlası (`apps/gastronomi`)
- **Halka Açık Keşif Portalı:** İslahiye'nin geleneksel lezzetlerini tanıtan editoryal vitrin, yemek ve tarif ayrımı (Dish vs. Recipe), ocaklık ritüelleri ve kültürel miras makaleleri.
- **Çift Modlu Harita:** Doğrulanmış koordinatlara sahip gerçek işletmeler ile sembolik lezzet bölgelerini birbirinden ayıran kültürel harita motoru.
- **Editoryal İçerik Yönetimi (CMS):** Yemek, tarif, usta, yerel ürün, etkinlik ve haberlerin taslak/inceleme/yayın döngüsüyle yönetildiği bağımsız yönetim masası (`/yonetim`).
- Ayrıntılı bilgi için: [apps/gastronomi/README.md](file:///c:/Users/Dell/Documents/PROJECT/Sehitkamil/islahiye-dijital-platformlar/apps/gastronomi/README.md)

### 2.2. İslahiye Ticaret Odası Eğitim Portalı (`apps/egitim`)
- **Halka Açık Ziyaretçi Deneyimi:** Mesleki eğitim kataloğu, dinamik başvuru rehberi, 2026 dönem takvimi, karekodlu belge sorgulama, aday kayıt ve giriş ekranları.
- **Operasyon Hiyerarşisi:** `Program → Dönem → Grup → Ders Oturumu` zinciri üzerinden eşzamanlı grup ve eğitmen yönetimi.
- **Kişiselleştirilmiş Rol Deneyimleri:**
  - **Aday Paneli (`/aday`):** Program seçimi, ön başvuru formu ve şeffaf aşama takibi.
  - **Kursiyer Paneli (`/kursiyer`):** Ders programı, devam çizelgesi, ödev teslim/revizyonları ve belgeler.
  - **Eğitmen Paneli (`/egitmen`):** Oturum yönetimi, manuel yoklama (katıldı/katılmadı/mazeretli) ve ödev puanlama (0-100).
  - **Yönetici Masaları (`/yonetim`):** Kriter bazlı puanlama motoru, kesin kayıt, kontenjan, oturum takvimi, başarı onayı ve sertifika kütüğü.
  - **Süper Admin Konsolu (`/yonetim/super-admin`):** 24 anahtarlı granüler yetki matrisi, kullanıcı/rol yönetimi, sürümlü sistem politikaları ve maskelenmiş denetim kayıtları.
- Ayrıntılı bilgi için: [apps/egitim/README.md](file:///c:/Users/Dell/Documents/PROJECT/Sehitkamil/islahiye-dijital-platformlar/apps/egitim/README.md)

---

## 3. Teknoloji Yığını

Platformlar, modern frontend ve kurumsal backend teknolojileri üzerine Clean Architecture prensipleriyle inşa edilmiştir:

### Frontend
| Teknoloji | Versiyon | Kullanım Alanı |
|---|---|---|
| **React** | `^18.3.1` | Kullanıcı arayüzü kütüphanesi (Fonksiyonel bileşenler & Hooks) |
| **TypeScript** | `~5.6.3` | Uçtan uca tip güvenliği ve veri modelleme |
| **Vite** | `^5.4.11` | Hızlı geliştirme ortamı ve optimize edilmiş üretim derlemesi |
| **Tailwind CSS** | `^3.4.15` | Kurumsal tasarım sistemleri ve yardımcı sınıf mimarisi |
| **React Router** | `^6.28.0` | İstemci taraflı sayfa ve panel yönlendirmesi |
| **Lucide React** | `^0.460.0` | Tutarlı ve hafif semantik ikon kütüphanesi |
| **Leaflet & React-Leaflet** | `^1.9.4` | Yalnızca Gastronomi: İnteraktif lezzet haritası |
| **Framer Motion** | `^14.3.0` | Yalnızca Gastronomi: Akıcı editoryal mikro animasyonlar |
| **QRCode & PNGjs** | `^1.5.4` | Yalnızca Eğitim: İstemci taraflı dinamik belge doğrulama karekodu |

### Backend (Mikro/Modüler Servisler)
| Teknoloji | Versiyon | Kullanım Alanı |
|---|---|---|
| **.NET / C#** | `9.0` | Yüksek performanslı kurumsal Web API çekirdeği |
| **ASP.NET Core** | `9.0` | REST API Controller'lar, Swagger/OpenAPI ve Minimal API |
| **Entity Framework Core** | `9.0` | ORM, Code-First Migration'lar ve LINQ sorgu altyapısı |
| **SQL Server / SQLite** | `Enterprise / Local` | İlişkisel veritabanı, Idempotency kütüğü ve denetim izleri |
| **Clean Architecture** | — | Domain, Application, Infrastructure ve API katmanlı ayrım |
| **xUnit & FluentAssertions** | `2.8+` | Kapsamlı birim ve kabul entegrasyon testleri |

---

## 4. Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js:** `v18.0.0` veya üzeri (LTS sürümü önerilir)
- **npm:** `v9.0.0` veya üzeri
- **.NET SDK:** `9.0` veya üzeri (Backend servisleri için)

### 4.1. Bağımlılıkların Kurulması
Monorepo kök dizininde tek bir komut ile tüm çalışma alanlarının bağımlılıkları kurulur:

```bash
npm install
```

### 4.2. Frontend Uygulamalarını Çalıştırma

```bash
# İslahiye Lezzet Atlası uygulamasını başlat (Port 5173)
npm run dev:gastronomi

# İslahiye Eğitim Portalı uygulamasını başlat (Port 5174 veya boş port)
npm run dev:egitim
```

### 4.3. Backend C# API Servislerini Çalıştırma

```bash
# Gastronomi Web API'sini başlat (Port 5235)
npm run dev:api:gastronomi

# Eğitim Portalı Web API'sini başlat (Port 5234)
npm run dev:api:egitim
```

### 4.4. Derleme ve Test Kontrolleri

```bash
# Tüm frontend uygulamalarını derle
npm run build

# Gastronomi C# API projesini derle
npm run build:api:gastronomi

# Gastronomi C# testlerini çalıştır
npm run test:api:gastronomi
```

---

## 5. Sürekli Entegrasyon ve Kalite Otomasyonu (CI / CD)

Proje, kurumsal yazılım standartları doğrultusunda **GitHub Actions** tabanlı sürekli entegrasyon iş akışına sahiptir:

- **İş Akışı Dosyası:** `.github/workflows/ci.yml`
- **Tetikleyiciler:** `main` veya `master` branch'ine yapılan her `push` ve `pull_request` işlemi.
- **Otomasyon Kapsamı:**
  1. **Ortam Kurulumu:** Temiz `ubuntu-latest` sanal makinesinde Node.js 20 LTS ve bağımlılıkların (`npm ci`) kurulması.
  2. **İslahiye Lezzet Atlası:** TypeScript statik tip denetimi ve optimize Vite üretim derlemesi (`npm run build:gastronomi`).
  3. **İslahiye Eğitim Portalı:** TypeScript statik tip denetimi ve optimize Vite üretim derlemesi (`npm run build:egitim`).
- **Faydaları:** Kod tabanına yapılacak herhangi bir hatalı tip, eksik import veya derleme kırılmasını anında yakalar; GitHub üzerinde yeşil kalite onayı rozeti sağlar.

---

## 6. Ortak Geliştirme İlkeleri

1. **Ürün Bağımsızlığı Sınırı:** İki uygulama tek bir React uygulamasında birleştirilemez. Router, sayfa yapıları, temalar ve veri depoları ayrı tutulur.
2. **Tasarım Bütünlüğü:** Gastronomi uygulamasındaki sıcak dergi tipografisi (Cormorant Garamond) eğitim panelinde kullanılmaz; eğitim panelindeki dashboard grid dili gastronomiye kopyalanmaz.
3. **Erişilebilirlik (WCAG):** Her ekranda semantik HTML5 etiketleri, klavye gezintisi (`Tab`, `Escape`), yüksek kontrast oranları ve dokunmatik ekran uygunluğu (min 44x44px) esastır.
4. **Veri ve Tip Ayrımı:** Tek dosyalı devasa bileşenler yazılmaz; TypeScript tipleri `src/types/`, veri depoları `src/data/` veya `src/services/` klasörlerinde yapılandırılır.

---

## 7. Mevcut Geliştirme Durumu ve Mimari Olgunluk

### Mevcut Durum (Frontend & Backend Çözümü)
- **Frontend Katmanı:** Her iki ürün (`apps/gastronomi` ve `apps/egitim`) tam etkileşimli, zengin arayüzlü, responsive ve WCAG uyumlu birer bağımsız uygulama olarak tamamlanmıştır.
- **Backend Katmanı:** `services/education-api` ve `services/gastronomy-api` projelerinde .NET 9, Clean Architecture, Entity Framework Core ve SQL Server/SQLite altyapısıyla uçtan uca REST API'ler geliştirilmiştir.
- **Güvenlik & Doğrulama:** Admin paneli erişim kalkanları, XSS ve URL sanitizasyonu, kriptografik oturum imzaları ve WORM denetim kütükleri mevcuttur.

### Canlı Canlıya Alma (Deployment Roadmap) Adımları
1. **Canlı Sunucu Yayını:** Docker / Azure App Service üzerinde .NET API ve Nginx frontend container'larının ayağa kaldırılması.
2. **Resmî Servis Entegrasyonları:**
   - Canlı SMS ve e-posta bildirim sağlayıcıları (Netgsm/Turkcell, SendGrid/SMTP).
   - Canlı TÜRKPATENT coğrafi işaret veri tabanı senkronizasyonu.
   - e-Devlet Kapısı üzerinden kimlik ve ikametgah doğrulama.
3. **Bulut Medya Saklama:** S3 veya Azure Blob Storage üzerinde imzalı (presigned) dosya saklama ve CDN dağıtımı.

---

## 8. Dokümantasyon ve Kılavuzlar

Uygulamaların kapsam ve detaylarına aşağıdaki bağımsız kılavuzlardan erişebilirsiniz:

- **Monorepo Ana Kılavuzu:** [`README.md`](file:///c:/Users/Dell/Documents/PROJECT/Sehitkamil/islahiye-dijital-platformlar/README.md)
- **İslahiye Lezzet Atlası Dokümantasyonu:** [`apps/gastronomi/README.md`](file:///c:/Users/Dell/Documents/PROJECT/Sehitkamil/islahiye-dijital-platformlar/apps/gastronomi/README.md)
  - Çift modlu harita mimarisi, yemek/tarif modeli, editoryal CMS modülleri ve TÜRKPATENT standartları.
- **İslahiye Eğitim Portalı Dokümantasyonu:** [`apps/egitim/README.md`](file:///c:/Users/Dell/Documents/PROJECT/Sehitkamil/islahiye-dijital-platformlar/apps/egitim/README.md)
  - Akademik operasyon hiyerarşisi, rol panelleri, manuel yoklama kuralı, başarı formülü ve 24 anahtarlı yetki matrisi.

> **Geliştirici Notu:** Geliştirme sürecinde kullanılan ham kartografik veriler, araştırma testleri ve ara sprint teslim raporları yerel geliştirme arşivinde (`scratch/` ve `docs/`) muhafaza edilmekte olup, üretim reposunun temiz kalması adına `.gitignore` ile korunmaktadır.

---

© 2026 İslahiye Ticaret Odası. Tüm hakları saklıdır.
