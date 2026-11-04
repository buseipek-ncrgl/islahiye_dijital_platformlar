import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dish } from '../types';
import { Header } from '../components/layout/Header';
import { Hero } from '../components/home/Hero';
import { DiscoveryRibbon } from '../components/home/DiscoveryRibbon';
import { HomeMapTeaser } from '../components/home/HomeMapTeaser';
import { FeaturedDishes } from '../components/home/FeaturedDishes';
import { DiscoverDistrictSection } from '../components/home/DiscoverDistrictSection';
import { InstagramFeedSection } from '../components/home/InstagramFeedSection';
import { Footer } from '../components/layout/Footer';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleScrollTo = (sectionId: string) => {
    const el = document.querySelector(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDishSelect = (dish: Dish) => {
    navigate(`/yemekler/${dish.id}`);
  };

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#242724] font-sans selection:bg-[#BA855E] selection:text-[#F6F2E9]">
      {/* Header */}
      <Header onNavigate={handleScrollTo} />

      {/* Main 5-Section Editorial Flow */}
      <main>
        {/* 01. İslahiye'ye Hoş Geldiniz — Karşılama */}
        <Hero
          onExploreDishes={() => handleScrollTo('#lezzetler')}
          onExploreMap={() => handleScrollTo('#lezzet-haritasi')}
        />

        {/* 01b. Keşif Şeridi — Hızlı Kısayol Menüsü */}
        <DiscoveryRibbon
          onNavigateToMap={() => handleScrollTo('#lezzet-haritasi')}
          onNavigateToDishes={() => handleScrollTo('#lezzetler')}
          onNavigateToDistrict={() => handleScrollTo('#islahiyeyi-kesfet')}
          onNavigateToHeritage={() => navigate('/mutfak-mirasi')}
        />

        {/* 02. İslahiye Lezzet Haritası — Ana Deneyim */}
        <HomeMapTeaser
          onSelectDish={handleDishSelect}
        />

        {/* 03. Yöresel Tarifler — Ana Hedef */}
        <FeaturedDishes
          onSelectDish={handleDishSelect}
        />

        {/* 04. İslahiye'yi Keşfet — İlçe Tanıtımı */}
        <DiscoverDistrictSection />

        {/* 05. İslahiye'den Kareler — Güncellik (İTO Resmî Instagram) */}
        <InstagramFeedSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
