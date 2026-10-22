import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Dish } from '../types';
import { Header } from '../components/layout/Header';
import { Hero } from '../components/home/Hero';
import { DiscoveryRibbon } from '../components/home/DiscoveryRibbon';
import { CulturalHeritageShowcase } from '../components/home/CulturalHeritageShowcase';
import { FeaturedDishes } from '../components/home/FeaturedDishes';
import { RecipeWorkshop } from '../components/home/RecipeWorkshop';
import { HomeMapTeaser } from '../components/home/HomeMapTeaser';
import { ArtisansShowcase } from '../components/home/ArtisansShowcase';
import { GastronomyFilmsShowcase } from '../components/home/GastronomyFilmsShowcase';
import { EditorialAgendaShowcase } from '../components/home/EditorialAgendaShowcase';
import { RecipePreviewModal } from '../components/home/RecipePreviewModal';
import { RoadmapTeaser } from '../components/home/RoadmapTeaser';
import { Footer } from '../components/layout/Footer';

export const HomePage: React.FC = () => {
  const location = useLocation();
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [workshopRecipeId, setWorkshopRecipeId] = useState<string>('recipe-islahiye-tava');

  useEffect(() => {
    const state = location.state as { recipeId?: string } | null;
    if (state?.recipeId) {
      setWorkshopRecipeId(state.recipeId);
    }
  }, [location.state]);

  const handleScrollTo = (sectionId: string) => {
    const el = document.querySelector(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenInWorkshop = (recipeId: string) => {
    setWorkshopRecipeId(recipeId);
    // Smooth scroll to workshop
    setTimeout(() => {
      handleScrollTo('#tarif-atolyesi');
    }, 50);
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal font-sans selection:bg-copper selection:text-ivory">
      {/* 1. Header */}
      <Header onNavigate={handleScrollTo} />

      {/* Main Content Area */}
      <main>
        {/* 2. Hero Section */}
        <Hero
          onExploreDishes={() => handleScrollTo('#lezzetler')}
          onExploreMap={() => handleScrollTo('#lezzet-haritasi')}
        />

        {/* 2b. Discovery Ribbon (Hero Altı 4 Öğeli Keşif Şeridi) */}
        <DiscoveryRibbon
          onNavigateToDishes={() => handleScrollTo('#lezzetler')}
          onNavigateToWorkshop={() => handleScrollTo('#tarif-atolyesi')}
          onNavigateToMap={() => handleScrollTo('#lezzet-haritasi')}
          onNavigateToHeritage={() => handleScrollTo('#kultur-mirasi')}
        />

        {/* 3. Cultural Heritage Showcase (Mirasın İzinde) */}
        <CulturalHeritageShowcase />

        {/* 4. Featured Dishes Showcase (Yöresel Lezzetler) */}
        <FeaturedDishes
          onSelectDish={(dish) => setSelectedDish(dish)}
          onOpenWorkshop={handleOpenInWorkshop}
        />

        {/* 5. Interactive Recipe Workshop (Tarif Atölyesi) */}
        <RecipeWorkshop initialRecipeId={workshopRecipeId} />

        {/* 6. Cultural Flavour Map Teaser (Lezzet Haritası & Atlas) */}
        <HomeMapTeaser
          onSelectDish={(dish) => setSelectedDish(dish)}
          onOpenWorkshop={handleOpenInWorkshop}
        />

        {/* 7. Artisans and Producers (Ustalar & Zanaatkârlar) */}
        <ArtisansShowcase />

        {/* 8. Gastronomy Films Showcase (10 Bölümlük Belgesel Serisi) */}
        <GastronomyFilmsShowcase />

        {/* 9. Editorial Gazette & Agenda Showcase (Haberler & Etkinlikler) */}
        <EditorialAgendaShowcase />

        {/* 10. Institutional Roadmap Teaser */}
        <RoadmapTeaser />
      </main>

      {/* 10. Footer */}
      <Footer />

      {/* 9. Recipe Preview Modal */}
      <RecipePreviewModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onOpenInWorkshop={handleOpenInWorkshop}
      />
    </div>
  );
};

export default HomePage;
