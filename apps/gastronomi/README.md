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
- **Ustalar & Üreticiler Arşivi (`/yonetim/ustalar`):** Yerel ustaların biyografileri, zanaat dalları ve izin belgeleri.
- **Harita ve Mekân Yönetimi (`/yonetim/harita`):** Haritaya yeni ziyaret noktası ekleme, koordinat belirleme ve lezzet kategorisi bağlama.
- **Kültürel Miras Makaleleri (`/yonetim/kulturel-miras`):** Editoryal hikâyelerin yazımı ve görsel yönetimi.
- **Haber, Duyuru ve Etkinlik Yönetimi (`/yonetim/haberler`, `/yonetim/duyurular`, `/yonetim/etkinlikler`):** Yayın takvimine içerik ekleme ve arşivleme.
- **Medya Kütüphanesi (`/yonetim/medya`):** Yüklenen fotoğrafların envanteri, çözünürlük, lisans ve orijin bilgileri.
- **Merkezi Yayın & Vitrin Yönetimi (`/yonetim/yayin-yonetimi`):** Ana sayfa vitrin bloklarında hangi yemek veya haberlerin gösterileceğinin belirlenmesi.
- **Yönetim Ayarları (`/yonetim/ayarlar`):** Platform meta verileri, varsayılan harita merkezi ve yerel veriyi fabrika ayarlarına sıfırlama.

---

## 5. Görsel ve İçerik Doğruluğu Standartları

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

## 7. Dizin Yapısı

```
apps/gastronomi/
├── src/
│   ├── assets/             # Statik görseller, motifler ve ikonlar
│   ├── components/         # Arayüz bileşenleri
│   │   ├── admin/          # CMS Yönetim Masası bileşenleri (Navbar, Sidebar, Formlar)
│   │   ├── common/         # Paylaşılan genel bileşenler (Modal, Breadcrumb, Tabs)
│   │   ├── home/           # Ana sayfa editoryal blokları
│   │   ├── layout/         # Sayfa çerçevesi, Header ve Footer
│   │   └── map/            # Leaflet harita katmanları ve kartları
│   ├── data/               # Tipli mock içerik havuzu (dishes, recipes, geo, media...)
│   ├── hooks/              # Özel React kancaları
│   ├── pages/              # Ziyaretçi sayfaları (Home, Map, Heritage, News...)
│   │   └── admin/          # CMS yönetim sayfaları (Dishes, Recipes, Places...)
│   ├── services/           # İçerik deposu ve repository katmanı
│   │   └── content/        # contentStore.ts, contentRepository.ts
│   ├── styles/             # Tailwind ve özel CSS kuralları
│   └── types/              # TypeScript veri modelleri (Dish, Recipe, Place, Artisan...)
├── index.html              # HTML şablonu (Google Fonts: Cormorant Garamond & Manrope)
├── package.json            # Bağımlılıklar ve çalıştırma scriptleri
├── tailwind.config.js      # Sıcak Editoryal Premium renk ve font yapılandırması
├── tsconfig.json           # TypeScript derleyici kuralları
└── vite.config.ts          # Vite geliştirme sunucusu yapılandırması (Port: 5173)
```

---

## 8. Geliştirme ve Derleme Komutları

Uygulama dizininde (`apps/gastronomi`) aşağıdaki komutlar çalıştırılabilir:

```bash
# Geliştirme sunucusunu başlat (Varsayılan Port: 5173)
npm run dev

# TypeScript kontrolü ve üretim derlemesi (Production Build)
npm run build

# Üretim paketini yerel olarak önizle
npm run preview
```

---

## 9. Mevcut Geliştirme Durumu ve Üretim Ortamı Gereksinimleri

### Mevcut Durum (Frontend Prototip & CMS Demosu)
- Uygulama, tam etkileşimli bir **frontend sunum ve editoryal prototipi** olarak çalışmaktadır.
- CMS yönetim panelindeki içerik ekleme, düzenleme ve vitrin sıralama işlemleri tarayıcı yerel saklama alanında (`localStorage`) `contentStore.ts` servisi ile simüle edilir.
- Sayfa yenilendiğinde yapılan düzenlemeler tarayıcı oturumunda korunur; istenildiğinde `/yonetim/ayarlar` sayfasından fabrika ayarlarına sıfırlanabilir.

### Üretim Sürümü (Production Roadmap) Gereksinimleri
Canlı operasyona geçiş için geliştirilecek backend altyapısı:
1. **İlişkisel Veritabanı ve REST API:** Yemek, tarif, porsiyon, malzeme ve koordinat ilişkilerini yöneten PostgreSQL/SQL Server mimarisi.
2. **Medya Depolama ve CDN:** Yüksek çözünürlüklü fotoğraflar ve videolar için otomatik WebP dönüştürücü ve CDN dağıtımı (AWS S3 / Cloudinary).
3. **Rol ve Oturum Yönetimi:** Editör ve yayın yetkilisi ayrımını doğrulayan JWT/OAuth2 tabanlı güvenli kimlik doğrulama.
4. **Resmî Saha Koordinat Doğrulaması:** İslahiye'deki işletmelerin belediye ruhsatı ve harita koordinatlarının saha denetimiyle doğrulanması.

---

© 2026 İslahiye Ticaret Odası. Tüm hakları saklıdır.
