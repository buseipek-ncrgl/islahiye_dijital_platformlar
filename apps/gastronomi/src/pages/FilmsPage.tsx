import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Film } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { GastronomyFilmsShowcase } from '../components/home/GastronomyFilmsShowcase';

export const FilmsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0D1914] text-ivory font-sans flex flex-col justify-between selection:bg-copper selection:text-ivory">
      {/* 1. Global Header */}
      <Header />

      <main className="flex-1">
        {/* Top Breadcrumb & Status Bar */}
        <div className="border-b border-sand/15 bg-forest-950/80 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-sand/70 hover:text-ivory transition-colors focus:outline-none font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfaya Dön</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-sand/60">
              <Film className="w-3.5 h-3.5 text-copper-light" />
              <span>Gastronomi Medya &amp; Belgesel Arşivi</span>
            </div>
          </div>
        </div>

        {/* 2. Cinematic Showcase Component */}
        <GastronomyFilmsShowcase />
      </main>

      {/* 3. Global Footer */}
      <Footer />
    </div>
  );
};

export default FilmsPage;

