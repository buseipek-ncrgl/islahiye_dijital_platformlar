import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Get dynamic page title based on path
  const getPageInfo = () => {
    const p = location.pathname;
    if (p === '/yonetim') {
      return {
        title: 'Kurumsal CMS Genel Bakış',
        subtitle: 'İslahiye Lezzet Atlası içerik envanteri, yayın durumu ve güvenilirlik metrikleri.',
      };
    }
    if (p.includes('/yemekler')) {
      return {
        title: 'Yöresel Yemek Envanteri',
        subtitle: 'Tescilli ve geleneksel İslahiye yemekleri, kategori ve malzeme tanımları.',
      };
    }
    if (p.includes('/tarifler')) {
      return {
        title: 'Tarif Atölyesi Yönetimi',
        subtitle: 'Porsiyon ölçekli tarif adımları, usta ipuçları ve ocaklık hazırlıkları.',
      };
    }
    if (p.includes('/urunler')) {
      return {
        title: 'Yerel Ürünler & Coğrafi İşaretler',
        subtitle: 'TÜRKPATENT tescilli ürün kayıtları, şartname belgeleri ve menşe bilgileri.',
      };
    }
    if (p.includes('/ustalar')) {
      return {
        title: 'Ustalar & Üreticiler Arşivi',
        subtitle: 'Saha kayıtları, izin belgeleri ve zanaatkâr biyografi planlaması.',
      };
    }
    if (p.includes('/harita')) {
      return {
        title: 'Gastronomi Haritası Noktaları',
        subtitle: 'Kültürel keşif atlası ve doğrulanmış fiziksel ziyaret noktaları yönetimi.',
      };
    }
    if (p.includes('/kulturel-miras')) {
      return {
        title: 'Mutfak Mirası & Bellek Yazıları',
        subtitle: 'Ocaklık ritüelleri, mevsimsel hasat anlatıları ve sözlü tarih kayıtları.',
      };
    }
    if (p.includes('/medya')) {
      return {
        title: 'Medya & Sinematik Klip Kütüphanesi',
        subtitle: 'Atmosfer videoları, yüksek çözünürlüklü fotoğraflar ve lisans envanteri.',
      };
    }
    if (p.includes('/haberler')) {
      return {
        title: 'Haberler & Editoryal Gazete',
        subtitle: 'Resmî bülten haberleri ve mutfak kültürü araştırma makaleleri.',
      };
    }
    if (p.includes('/duyurular')) {
      return {
        title: 'Kurumsal Duyurular',
        subtitle: 'Resmî bilgilendirmeler, program çağrıları ve faaliyet takvimi.',
      };
    }
    if (p.includes('/etkinlikler')) {
      return {
        title: 'Gastronomi Etkinlikleri & Atölyeler',
        subtitle: 'Planlanan buluşmalar, seminerler ve geçmiş etkinlik arşivi.',
      };
    }
    if (p.includes('/yayin-yonetimi')) {
      return {
        title: 'Yayın ve Doğrulama Denetimi',
        subtitle: 'Yayındaki ve taslaktaki içeriklerin güvenilirlik ve kaynak denetimi.',
      };
    }
    if (p.includes('/ayarlar')) {
      return {
        title: 'Sistem Ayarları & Rol Simülasyonu',
        subtitle: 'CMS konfigürasyonu, erişim yetkileri ve kurumsal veri ilkeleri.',
      };
    }
    return {
      title: 'İçerik Yönetim Sistemi',
      subtitle: 'İslahiye Lezzet Atlası CMS',
    };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="min-h-screen bg-slate-50 text-charcoal font-sans antialiased">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Topbar */}
        <AdminTopbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={title}
          subtitle={subtitle}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* CMS Subtle Footer */}
        <footer className="h-12 border-t border-slate-200 px-6 flex items-center justify-between text-[11px] font-mono text-slate-500 bg-white">
          <div>
            İslahiye Dijital Platformlar — Gastronomi CMS v0.2.0 (Demo)
          </div>
          <div className="flex items-center gap-4">
            <span>Sprint 02A: Salt Okunur Yönetim Arayüzü</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
