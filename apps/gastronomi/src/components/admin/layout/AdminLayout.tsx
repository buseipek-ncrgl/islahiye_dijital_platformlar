import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { BackendOfflineBanner } from '../common/BackendOfflineBanner';
import { AdminRoleProvider } from '../../../context/AdminRoleContext';
import { AdminAuthProvider } from '../../../context/AdminAuthContext';
import { AdminAuthGuard } from '../auth/AdminAuthGuard';
import { BackendConnectionProvider, useBackendConnection } from '../../../context/BackendConnectionContext';

const AdminShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isOnline } = useBackendConnection();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Get dynamic page title based on path
  const getPageInfo = () => {
    const p = location.pathname;
    if (p === '/yonetim') {
      return {
        title: 'Gastronomi Yönetim Portalı Genel Bakış',
        subtitle: 'İslahiye Lezzet Atlası içerik envanteri, yayın durumu ve envanter metrikleri.',
      };
    }
    if (p.includes('/yemekler')) {
      return {
        title: 'Yöresel Yemekler Envanteri',
        subtitle: 'Tescilli ve geleneksel İslahiye yemekleri, kategori ve malzeme tanımları.',
      };
    }
    if (p.includes('/tarifler')) {
      return {
        title: 'Geleneksel Tarifler Envanteri',
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
        title: 'Gastronomi Haritası & Lezzet Durakları',
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
        title: 'Kurumsal Duyurular Masası',
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
        title: 'Merkezi Yayın & Doğrulama Masası',
        subtitle: 'Yayındaki ve taslaktaki içeriklerin güvenilirlik ve kaynak denetimi.',
      };
    }
    if (p.includes('/ayarlar')) {
      return {
        title: 'Sistem Ayarları & Rol Yönetimi',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased admin-cms">
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
          <BackendOfflineBanner />
          <Outlet />
        </main>

        {/* CMS Subtle Footer */}
        <footer className="h-12 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-500 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">İslahiye Dijital Platformlar</span>
            <span>—</span>
            <span>Gastronomi CMS Portalı</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>
              {isOnline ? 'Bağlantı: Sunucu API Aktif' : 'Depo: Yerel Tarayıcı Belleği'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const AdminLayout: React.FC = () => {
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>
        <BackendConnectionProvider>
          <AdminRoleProvider>
            <AdminShell />
          </AdminRoleProvider>
        </BackendConnectionProvider>
      </AdminAuthGuard>
    </AdminAuthProvider>
  );
};
