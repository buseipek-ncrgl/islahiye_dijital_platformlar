/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',       // Sidebar, birincil başlıklar
          blue: '#2563EB',       // Birincil eylemler, butonlar, aktif sekmeler
          blueHover: '#1D4ED8',  // Buton hover
          slateBg: '#F8FAFC',    // Genel sayfa arka planı
          card: '#FFFFFF',       // Yüzey ve kart arka planları
          border: '#E2E8F0',     // Bileşen sınırları
          borderHover: '#CBD5E1',// Kenarlık hover
          textPrimary: '#0F172A',// Yüksek kontrastlı metin
          textSecondary: '#475569', // İkincil metin ve açıklamalar
          textMuted: '#94A3B8',  // İpucu ve pasif metinler
          success: '#059669',    // %80+ Devam, kabul kararı, onay
          successBg: '#ECFDF5',  // Başarı rozeti arka planı
          successBorder: '#A7F3D0',
          warning: '#D97706',    // Mazeretli, revizyon, yaklaşan ödev
          warningBg: '#FFFBEB',  // Uyarı rozeti arka planı
          warningBorder: '#FDE68A',
          danger: '#DC2626',     // Devamsızlık, ret kararı, form hataları
          dangerBg: '#FEF2F2',   // Kritik durum arka planı
          dangerBorder: '#FECACA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        drawer: '-4px 0 24px -2px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
}
