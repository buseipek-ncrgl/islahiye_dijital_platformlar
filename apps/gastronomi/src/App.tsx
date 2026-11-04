import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { HeritagePage } from './pages/HeritagePage';
import { HeritageStoryDetailPage } from './pages/HeritageStoryDetailPage';
import { NewsPage } from './pages/NewsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { EventsPage } from './pages/EventsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { DishesCatalogPage } from './pages/DishesCatalogPage';
import { DishDetailPage } from './pages/DishDetailPage';
import { AdminLayout } from './components/admin/layout/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminContentListPage } from './pages/admin/AdminContentListPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { DishFormPage } from './pages/admin/DishFormPage';
import { RecipeFormPage } from './pages/admin/RecipeFormPage';
import { ArticleFormPage } from './pages/admin/ArticleFormPage';
import { MediaLibraryPage } from './pages/admin/MediaLibraryPage';
import { CulturalStoryFormPage } from './pages/admin/CulturalStoryFormPage';
import { ArtisanFormPage } from './pages/admin/ArtisanFormPage';
import { AdminMapPage } from './pages/admin/AdminMapPage';
import { PlaceFormPage } from './pages/admin/PlaceFormPage';
import { AnnouncementFormPage } from './pages/admin/AnnouncementFormPage';
import { EventFormPage } from './pages/admin/EventFormPage';
import { CentralPublicationPage } from './pages/admin/CentralPublicationPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Visitor Portal Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/yemekler" element={<DishesCatalogPage />} />
        <Route path="/yemekler/:slug" element={<DishDetailPage />} />
        <Route path="/tarifler" element={<DishesCatalogPage />} />
        <Route path="/tarifler/:slug" element={<DishDetailPage />} />
        <Route path="/lezzet-haritasi" element={<MapPage />} />
        <Route path="/mutfak-mirasi" element={<HeritagePage />} />
        <Route path="/mutfak-mirasi/:slug" element={<HeritageStoryDetailPage />} />
        <Route path="/haberler" element={<NewsPage />} />
        <Route path="/haberler/:slug" element={<NewsDetailPage />} />
        <Route path="/etkinlikler" element={<EventsPage />} />
        <Route path="/duyurular" element={<AnnouncementsPage />} />

        {/* CMS Administration Routes (Sprint 02A - 02C) */}
        <Route path="/yonetim" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route
            path="yemekler"
            element={
              <AdminContentListPage
                forcedType="dish"
                forcedTitle="Yöresel Yemekler Envanteri"
                forcedDescription="İslahiye Lezzet Atlası kayıtlı tescilli ve geleneksel yemekler."
              />
            }
          />
          <Route path="yemekler/yeni" element={<DishFormPage />} />
          <Route path="yemekler/:id/duzenle" element={<DishFormPage />} />
          <Route
            path="tarifler"
            element={
              <AdminContentListPage
                forcedType="recipe"
                forcedTitle="Geleneksel Tarifler Envanteri"
                forcedDescription="Porsiyon ölçekli tarif adımları, usta ipuçları ve ocaklık hazırlıkları."
              />
            }
          />
          <Route path="tarifler/yeni" element={<RecipeFormPage />} />
          <Route path="tarifler/:id/duzenle" element={<RecipeFormPage />} />
          <Route
            path="urunler"
            element={
              <AdminContentListPage
                forcedTitle="Yerel Ürünler & Coğrafi İşaretler"
                forcedDescription="TÜRKPATENT tescilli ürün kayıtları, şartname belgeleri ve menşe bilgileri."
              />
            }
          />
          <Route
            path="ustalar"
            element={
              <AdminContentListPage
                forcedType="artisan"
                forcedTitle="Ustalar & Üreticiler Arşivi"
                forcedDescription="Saha kayıtları, izin belgeleri ve zanaatkâr biyografi planlaması."
              />
            }
          />
          <Route path="ustalar/yeni" element={<ArtisanFormPage />} />
          <Route path="ustalar/:id/duzenle" element={<ArtisanFormPage />} />
          <Route path="harita" element={<AdminMapPage />} />
          <Route path="harita/noktalar/yeni" element={<PlaceFormPage />} />
          <Route path="harita/noktalar/:id/duzenle" element={<PlaceFormPage />} />
          <Route
            path="kulturel-miras"
            element={
              <AdminContentListPage
                forcedType="editorial_article"
                forcedTitle="Mutfak Mirası & Bellek Yazıları"
                forcedDescription="Ocaklık ritüelleri, mevsimsel hasat anlatıları ve sözlü tarih kayıtları."
              />
            }
          />
          <Route path="kulturel-miras/yeni" element={<CulturalStoryFormPage />} />
          <Route path="kulturel-miras/:id/duzenle" element={<CulturalStoryFormPage />} />
          <Route path="medya" element={<MediaLibraryPage />} />
          <Route
            path="haberler"
            element={
              <AdminContentListPage
                forcedTitle="Haberler & Editoryal Gazete"
                forcedDescription="Resmî bülten haberleri ve mutfak kültürü araştırma makaleleri."
              />
            }
          />
          <Route path="haberler/yeni" element={<ArticleFormPage />} />
          <Route path="haberler/:id/duzenle" element={<ArticleFormPage />} />
          <Route
            path="duyurular"
            element={
              <AdminContentListPage
                forcedType="announcement"
                forcedTitle="Kurumsal Duyurular"
                forcedDescription="Resmî bilgilendirmeler, program çağrıları ve faaliyet takvimi."
              />
            }
          />
          <Route path="duyurular/yeni" element={<AnnouncementFormPage />} />
          <Route path="duyurular/:id/duzenle" element={<AnnouncementFormPage />} />
          <Route
            path="etkinlikler"
            element={
              <AdminContentListPage
                forcedType="event"
                forcedTitle="Gastronomi Etkinlikleri & Atölyeler"
                forcedDescription="Planlanan buluşmalar, seminerler ve geçmiş etkinlik arşivi."
              />
            }
          />
          <Route path="etkinlikler/yeni" element={<EventFormPage />} />
          <Route path="etkinlikler/:id/duzenle" element={<EventFormPage />} />
          <Route path="yayin-yonetimi" element={<CentralPublicationPage />} />
          <Route path="ayarlar" element={<AdminSettingsPage />} />
        </Route>

        {/* Fallback to HomePage */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
