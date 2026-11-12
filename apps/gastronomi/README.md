# İslahiye Lezzet Atlası — Gastronomi ve Kültür Portalı

İslahiye Ticaret Odası adına geliştirilen **İslahiye Lezzet Atlası**, bölgenin zengin mutfak mirasını, asırlık ocaklık geleneklerini, tescilli yerel tarım ürünlerini ve zanaatkârlarını modern bir editoryal dille belgeleyen bağımsız bir kültür ve gastronomi platformudur.

---

## 1. Ürünün Amacı ve Hedef Kitlesi

### Temel Amaç
- **Mutfak Mirasını Kayıt Altına Almak:** İslahiye'nin geleneksel yemeklerini, ocaklık ritüellerini ve pişirme tekniklerini kaybolmaktan kurtararak dijital belleğe aktarmak.
- **Yemek ve Tarif Ayrımı (Dish vs. Recipe):** Her yemeği tek bir reçeteye hapsetmeden; aynı yemeğin farklı köylerdeki ocaklık varyantlarını, usta tariflerini ve mevsimsel hazırlıklarını bağımsız olarak sunmak.
- **Doğrulanmış Coğrafi Keşif:** Gerçek ziyaret noktalarını (fırınlar, lokantalar, kooperatifler) kültürel keşif modundan açıkça ayırarak ziyaretçilere güvenilir bir rota sunmak.
- **E-Ticaret Değildir:** Platform doğrudan ürün veya yemek satışı yapmaz; kültürel değer yaratma, gastronomi turizmi ve bölgesel tanıtım odaklıdır.

### Hedef Kitle
- **Gastronomi Meraklıları ve Gezginler:** Bölgeye seyahat eden, otantik lezzet noktalarını ve yerel üreticileri arayan ziyaretçiler.
- **Araştırmacılar ve Kültür Yazarları:** İslahiye mutfak kültürü, mevsimlik hasatlar ve sözlü tarih üzerine çalışan uzmanlar.
- **Yerel Üreticiler ve Kooperatifler:** İslahiye biberi, firik buğdayı gibi yerel zenginlikleri üreten çiftçiler ve kadın kooperatifleri.
- **Kurum İçerik Editörleri:** İslahiye Ticaret Odası bünyesinde mutfak arşivini ve etkinlik takvimini güncelleyen yayın sorumluları.

---

## 2. Halka Açık Ziyaretçi Portalı

Platform, editoryal dergi estetiği ve zengin tipografiyle kurgulanmış halka açık sayfalardan oluşur:

### 2.1. Ana Sayfa (`/`)
- **Editoryal Giriş (Hero):** Büyük tipografi (Cormorant Garamond), duyusal anlatım ve İslahiye silüeti.
- **Öne Çıkan Yemekler Vitrini:** Gastronomi kategorilerine göre filtrelenebilir (Tandır & Fırın, Kazan Yemekleri, Hamur İşleri, Tatlılar).
- **Mutfak Mirası Seçkisi:** Ocaklık ritüelleri ve mevsimsel hasat hikâyelerinden editoryal alıntılar.
- **İnteraktif Harita Önizlemesi:** Lezzet rotalarına hızlı geçiş kartı.
- **Haberler & Etkinlikler Akışı:** Bölgedeki güncel gastronomi buluşmaları ve duyurular.

### 2.2. Çift Modlu Lezzet Haritası (`/lezzet-haritasi`)
Ziyaretçilere harita üzerinde iki farklı deneyim sunulur:
1. **Gerçek Ziyaret Noktaları Modu:**
   - Saha araştırmasıyla tescillenmiş gerçek restoranlar, taş fırınlar, biber kurutma alanları ve kooperatif satış noktaları.
   - Doğrulanmış koordinatlar (Leaflet altyapısı), adres, telefon ve çalışma saatleri.
2. **Kültürel Keşif Modu (Temsili Bölgesel Atlas):**
   - Belirli bir dükkânı olmayan, bölgenin genel ocaklık kültürüne ait yemeklerin temsili mahalle/köy dağılımı.
   - Gerçek konum iddiası taşımayan kültürel işaretçiler açıkça ayırt edilir.

### 2.3. Mutfak Mirası ve Bellek (`/mutfak-mirasi`, `/mutfak-mirasi/:slug`)
- Sözlü tarih kayıtları, mevsimsel kış hazırlıkları (salça, kurutmalık, pestil) ve geleneksel pişirme yöntemleri.
- Makale detaylarında zengin tipografi, usta anlatımları ve fotoğraf mozaikleri.

### 2.4. Haberler, Etkinlikler ve Duyurular
- **Haberler (`/haberler`, `/haberler/:slug`):** Bölgesel tarım bültenleri, hasat raporları ve gastronomi haberleri.
- **Etkinlikler (`/etkinlikler`):** İslahiye biber hasadı şenlikleri, atölyeler ve seminer takvimi.
- **Duyurular (`/duyurular`):** Resmî bilgilendirmeler ve üretici destek çağrıları.

---

## 3. Tarif Atölyesi ve Gastronomik Veri Modeli

### Yemek (Dish) ve Tarif (Recipe) Ayrımı
Platformda her yemek tek bir tariften ibaret değildir:
- **Yemek (Dish):** Kültürel kimliği tanımlar (Örn: *İslahiye Tava*, *Kazan Kebabı*, *Firik Pilavı*). Tarihçesi, kültürel önemi ve coğrafi aidiyeti burada yer alır.
- **Tarif (Recipe):** Bu yemeğin uygulanabilir reçetesidir. Aynı yemeğe ait farklı ustaların (Örn: *Fevzipaşa Taş Fırın Usulü*, *Ev Ocaklığı Usulü*) ayrı tarifleri ve video kayıtları bulunabilir.

### Tarif Detayı Özellikleri
- **Dinamik Porsiyon Ölçekleyici:** 2, 4, 6 veya 8 kişilik porsiyon seçimine göre malzeme miktarlarını otomatik hesaplama.
- **İnteraktif Malzeme Kontrol Listesi:** Hazırlık esnasında tamamlanan malzemeleri işaretleme.
- **Adım Adım Hazırlık Süreci:** Hazırlık, pişirme, ocak ateşi ayarı ve usta püf noktaları.
- **Görsel & Video Alanı:** Yalnızca gerçek çekim sağlanan tariflerde video oynatıcı devreye girer; boş veya sahte video oynatıcısı gösterilmez.

---

## 4. Editoryal İçerik Yönetimi (CMS — `/yonetim`)

İslahiye Ticaret Odası içerik sorumluları için tasarlanmış bağımsız yönetim konsolu:

### CMS Modülleri
- **Yönetim Paneli Ana Ekranı (`/yonetim`):** Toplam içerik sayıları, taslak/inceleme/yayın istatistikleri ve son işlemler.
- **Yemekler Envanteri (`/yonetim/yemekler`):** Yöresel yemek kartları, kategori atamaları, vitrin durumu.
- **Tarifler Envanteri (`/yonetim/tarifler`):** Porsiyon bazlı tarif adımları, malzeme listesi ve pişirme parametreleri.
- **Dinamik Kategori Yönetimi (`/yonetim/kategoriler`):** Yeni yemek/tarif kategorisi tanımlama, silme, düzenleme ve portala anlık yansıtma.
- **Ustalar & Üreticiler Arşivi (`/yonetim/ustalar`):** Yerel ustaların biyografileri, zanaat dalları ve izin belgeleri.
- **Harita ve Mekân Yönetimi (`/yonetim/harita`):** Haritaya yeni ziyaret noktası ekleme, koordinat belirleme ve lezzet kategorisi bağlama.
- **Kültürel Miras Makaleleri (`/yonetim/kulturel-miras`):** Editoryal hikâyelerin yazımı ve görsel yönetimi.
- **Haber, Duyuru ve Etkinlik Yönetimi (`/yonetim/haberler`, `/yonetim/duyurular`, `/yonetim/etkinlikler`):** Yayın takvimine içerik ekleme ve arşivleme.
- **Medya Kütüphanesi (`/yonetim/medya`):** Yüklenen fotoğrafların envanteri, çözünürlük, lisans ve orijin bilgileri.
- **Merkezi Yayın & Vitrin Yönetimi (`/yonetim/yayin-yonetimi`):** Ana sayfa vitrin bloklarında hangi yemek veya haberlerin gösterileceğinin belirlenmesi.
- **Yönetim Ayarları (`/yonetim/ayarlar`):** Platform meta verileri, varsayılan harita merkezi ve yerel veriyi fabrika ayarlarına sıfırlama.

---

## 5. Güvenlik, Kimlik Doğrulama ve API Entegrasyonu

Platform, kurumsal düzeyde güvenlik ve entegrasyon altyapısına sahiptir:

1. **Admin Erişim Kalkanı (`AdminAuthGuard`):** Yönetim paneline (`/yonetim`) halka açık bağlantı veya doğrudan URL girişi engellenir; imza doğrulamalı oturum kontrolü uygulanır.
2. **Kriptografik Oturum İmzası:** Yerel oturum tokenları tamper-proof (kurcalamaya karşı dayanıklı) SHA-256 HMAC imzasıyla korunur; yetkisiz storage müdahaleleri anında oturumu düşürür.
3. **XSS & Güvenli İçerik Filtresi (`src/utils/security.ts`):** Dışarıdan girilen URL'ler (`sanitizeUrl`), CSS arka planları (`sanitizeCssUrl`) ve kullanıcı metinleri (`escapeHtml`) XSS açıklarına karşı sanitize edilir.
4. **C# .NET 9 Web API Entegrasyonu (`services/gastronomy-api`):**
   - Clean Architecture katmanlı mimarisi (Domain, Application, Infrastructure, Api).
   - `/api/dishes`, `/api/recipes`, `/api/places`, `/api/stories`, `/api/films`, `/api/news-events` REST endpoint'leri.
   - Porsiyon ölçekleme motoru (`RecipeScaler`), zengin DTO'lar ve xUnit entegrasyon testleri.

---

## 6. Görsel ve İçerik Doğruluğu Standartları

Proje kapsamında kurumsal editoryal standartlar ve gastronomi gazeteciliği ilkeleri doğrultusunda belirlenen sıkı kurallar uygulanır:

1. **Resmî Tescil Kuralı:** İslahiye'de TÜRKPATENT tarafından tescillenen tek resmî ürün **"İslahiye Biberi" (Tescil No: 991)** ürünüdür. Tescil belgesi bulunmayan diğer lezzetler "Geleneksel / Yöresel Lezzet" olarak etiketlenir; uydurma resmî tescil atfedilmez.
2. **Görsel Doğruluğu:** Gerçek saha fotoğrafları ile arşiv/temsili görseller açıkça ayırt edilir. Gerçek fotoğrafı olmayan yemeğe hayali görsel konulmaz.
3. **Usta ve Mekân Mahremiyeti:** Gerçek kişilere ait telefon, adres ve fotoğraflar doğrulanmış izin olmadan eklenmez; uydurma usta anlatıları yazılmaz.
4. **Harita Koordinat Doğruluğu:** Doğrulanmış dükkân veya fırın adresi bulunmayan geleneksel ev yemeklerine hayali cadde koordinatı atanmaz; kültürel keşif modu kullanılır.

---

## 6. Tasarım Sistemi: Sıcak Editoryal Premium

Gastronomi portalı, yüksek gastronomi gazeteciliği ve kitap estetiğinden ilham alan **"Sıcak Editoryal Premium"** tasarım dilini kullanır:

- **Renk Paleti:**
  - *Orman Yeşili (Primary):* `#203B31`
  - *Kırık Beyaz / Parşömen (Surface):* `#F6F2E9`
  - *Sıcak Kiremit / Bakır (Accent):* `#BA855E`
  - *Kum Taşı / Doğal Nötr (Secondary):* `#DCCAB2`
  - *Derin Antrasit (Text):* `#242724`
- **Tipografi:**
  - *Başlıklar (Display/Headings):* `Cormorant Garamond` (Organik, zarif, editoryal serif)
  - *Arayüz ve Gövde Metinleri:* `Manrope` (Geometrik ve yüksek okunabilirlikli sans-serif)
- **Kompozisyon:** Mekanik kutu tekrarından kaçınılır; asimetrik fotoğraf mozaikleri, geniş beyaz alanlar ve duyusal mikro animasyonlar kullanılır.

---

## 8. Dizin Yapısı

```
apps/gastronomi/
├── src/
│   ├── assets/             # Statik görseller, motifler ve ikonlar
│   ├── components/         # Arayüz bileşenleri
│   │   ├── admin/          # CMS Yönetim Masası bileşenleri (Navbar, Sidebar, Formlar)
│   │   │   ├── auth/       # Admin giriş formu ve yetki kalkanı (AdminAuthGuard)
│   │   │   ├── charts/     # İstatistik ve içerik dağılım grafikleri
│   │   │   ├── common/     # Hızlı kategori modalı, resim yükleme ve onay kutuları
│   │   │   └── content/    # Veri tabloları, durum ve doğrulama rozetleri
│   │   ├── common/         # Paylaşılan genel bileşenler (Modal, Breadcrumb, Tabs)
│   │   ├── home/           # Ana sayfa editoryal blokları
│   │   ├── layout/         # Sayfa çerçevesi, Header ve Footer
│   │   └── map/            # Leaflet harita katmanları ve kartları
│   ├── context/            # Admin oturumu (AdminAuthContext) ve rol durum yönetimi
│   ├── data/               # Tipli içerik havuzu (dishes, recipes, geo, categories, media...)
│   ├── hooks/              # useContent, useAdminRole kancaları
│   ├── pages/              # Ziyaretçi sayfaları (Home, Map, Heritage, News, Films...)
│   │   └── admin/          # CMS sayfaları (Dishes, Recipes, CategoryManagement, Map...)
│   ├── services/           # İçerik deposu ve API istemcisi
│   │   ├── api/            # Gastronomy.Api C# backend istemcisi (gastronomyApiClient.ts)
│   │   └── content/        # contentStore.ts, contentRepository.ts
│   ├── styles/             # Tailwind ve özel CSS kuralları
│   ├── utils/              # security.ts (XSS sanitize, HMAC imza doğrulama, safeJsonParse)
│   └── types/              # TypeScript veri modelleri (Dish, Recipe, Place, Artisan, Admin...)
├── index.html              # HTML şablonu (Google Fonts: Cormorant Garamond & Manrope)
├── package.json            # Bağımlılıklar ve çalıştırma scriptleri
├── tailwind.config.js      # Sıcak Editoryal Premium renk ve font yapılandırması
├── tsconfig.json           # TypeScript derleyici kuralları
└── vite.config.ts          # Vite geliştirme sunucusu yapılandırması (Port: 5173)
```

---

## 9. Geliştirme ve Çalıştırma Komutları

### 9.1. Frontend Arayüzünü Çalıştırma
Uygulama dizininde (`apps/gastronomi`) veya monorepo kök dizininde aşağıdaki komutlar çalıştırılabilir:

```bash
# Frontend geliştirme sunucusunu başlat (Port: 5173)
npm run dev

# TypeScript kontrolü ve optimize üretim derlemesi (Production Build)
npm run build

# Üretim paketini yerel olarak önizle
npm run preview
```

### 9.2. C# .NET 9 Backend Web API'sini Çalıştırma
Gastronomi platformunun bağımsız C# arka uç servisi `services/gastronomy-api` altında yer almaktadır:

```bash
# 1. Monorepo kök dizininden tek komutla başlatma:
npm run dev:api:gastronomi

# 2. Veya doğrudan dotnet CLI ile başlatma:
dotnet run --project services/gastronomy-api/src/Gastronomy.Api

# 3. Arka uç testlerini çalıştırma:
npm run test:api:gastronomi
```

* **API Adresi & Karşılama Ekranı:** `http://localhost:5235`
* **OpenAPI / Swagger Spesifikasyonu:** `http://localhost:5235/openapi/v1.json`
* **Sağlık Denetimi (Health Check):** `http://localhost:5235/health/live`
* **REST Uç Noktaları:**
  * `GET /api/dishes` — Tüm yöresel yemekler ve kültürel detaylar
  * `GET /api/recipes` — Dinamik porsiyon ölçeklemeli tarifler
  * `GET /api/places` — Gerçek işletmeler ve lezzet haritası noktaları
  * `GET /api/stories` — Kültürel miras makaleleri
  * `GET /api/films` — Belgesel ve gastronomi filmleri seçkisi
* **Otomatik Veritabanı:** API ilk kez ayağa kalktığında `EnsureCreatedAsync` ve `GastronomyDataSeeder` sayesinde veritabanı otomatik olarak oluşturulur ve tüm başlangıç verileri tohumlanır (SQL Server veya sıfır konfigürasyonlu SQLite desteğiyle).

---

## 10. Mevcut Geliştirme Durumu ve Mimari Olgunluk

### Mevcut Durum (Frontend Portalı & C# Backend)
- **Frontend Portalı:** Tam etkileşimli, responsive ve WCAG standartlarına uygun modern editoryal vitrin ve CMS yönetim masası tamamlanmıştır.
- **C# Web API:** `services/gastronomy-api` altında Clean Architecture (Domain, Application, Infrastructure, Api) prensipleriyle yazılmış, DTO doğrulamalı ve Entity Framework Core tabanlı REST API hazırdır.
- **Dinamik Veri & Kategori Senkronizasyonu:** Hem `localStorage` destekli istemci kütüğü hem de C# REST API modelleri birbirine tam uyumlu çalışır.

### Canlıya Alma (Production Deployment Roadmap)
Canlı kurumsal operasyona geçiş için geriye kalan adımlar:
1. **Canlı Sunucu Yayını:** Docker / Linux konteynerleri üzerinde .NET 9 API ve Vite SPA yayınının yapılandırılması.
2. **Medya Depolama ve CDN:** Fotoğraflar ve videolar için AWS S3 / Cloudinary presigned URL ve CDN dağıtımı.
3. **Resmî Saha Koordinat Doğrulaması:** İslahiye'deki yeni işletmelerin belediye ruhsatı ve harita koordinatlarının saha denetimiyle sisteme eklenmesi.

---

© 2026 İslahiye Ticaret Odası. Tüm hakları saklıdır.
