import React from 'react';
import { Compass, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { GASTRONOMI_APP_META } from '../data/placeholder';
import { StatusBadge } from '../components/StatusBadge';

export const PlaceholderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-between p-6 md:p-12 selection:bg-copper selection:text-white">
      {/* Header Bar */}
      <header className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-sand/60">
        <div>
          <p className="text-xs tracking-widest uppercase font-semibold text-charcoal/70">
            {GASTRONOMI_APP_META.institution}
          </p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-forest mt-0.5">
            {GASTRONOMI_APP_META.appName}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge label={GASTRONOMI_APP_META.status} variant="warning" />
          <span className="text-xs font-mono bg-paper px-2.5 py-1 rounded border border-sand/80 text-charcoal/80">
            Port :{GASTRONOMI_APP_META.port}
          </span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="max-w-5xl mx-auto w-full my-auto py-12">
        <div className="bg-paper border border-sand/80 rounded-2xl p-8 md:p-14 shadow-sm relative overflow-hidden">
          {/* Subtle Decorative Accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-copper/10 via-sand/20 to-transparent pointer-events-none rounded-bl-full" />

          <div className="flex items-center gap-2 text-copper font-medium text-sm tracking-widest uppercase mb-4">
            <Sparkles className="w-4 h-4 text-copper" />
            <span>{GASTRONOMI_APP_META.phase}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold text-forest leading-tight mb-6">
            {GASTRONOMI_APP_META.workingTitle}
          </h1>

          <p className="text-base md:text-lg text-charcoal/80 max-w-2xl leading-relaxed mb-8">
            İslahiye lezzet hafızasını, tescilli yöresel tatları, adım adım tarifleri ve
            gastronomi haritasını sunacak olan halka açık portalın teknik altyapısı hazırlandı.
          </p>

          {/* Setup Verification Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-ivory/60 border border-sand/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-forest mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-forest">Bağımsız Uygulama Mimarisi</h4>
                <p className="text-xs text-charcoal/70 mt-0.5">
                  apps/gastronomi bağımsız Vite + React + TS yapılandırmasıyla çalışmaktadır.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-ivory/60 border border-sand/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-forest mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-forest">A — Sıcak Editoryal Tasarım</h4>
                <p className="text-xs text-charcoal/70 mt-0.5">
                  Orman yeşili (#203B31), Kırık beyaz (#F6F2E9) ve Cormorant Garamond fontları tanımlandı.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-ivory/60 border border-sand/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-forest mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-forest">Sprint 01 Hazırlığı</h4>
                <p className="text-xs text-charcoal/70 mt-0.5">
                  src/components, src/pages, src/data, src/types klasör mimarisi hazırlandı.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-ivory/60 border border-sand/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-forest mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-forest">Ayrı Çalıştırma ve Build</h4>
                <p className="text-xs text-charcoal/70 mt-0.5">
                  npm run dev:gastronomi ve npm run build:gastronomi komutlarıyla tam izole.
                </p>
              </div>
            </div>
          </div>

          {/* Action note */}
          <div className="pt-6 border-t border-sand/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-charcoal/60">
              <Layers className="w-4 h-4 text-copper" />
              <span>Sonraki Adım: {GASTRONOMI_APP_META.nextSprint}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-forest bg-forest/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                Faz 0 Onayı Bekleniyor
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-8 border-t border-sand/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal/60">
        <p>© 2026 {GASTRONOMI_APP_META.institution} — Dijital Platformlar Projesi</p>
        <p className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-copper" />
          <span>Ön tanıtım frontend prototipi / Simülasyon</span>
        </p>
      </footer>
    </div>
  );
};
