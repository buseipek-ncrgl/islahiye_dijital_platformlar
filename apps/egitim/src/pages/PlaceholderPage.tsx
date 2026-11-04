import React from 'react';
import { GraduationCap, ShieldCheck, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';
import { EGITIM_APP_META } from '../data/placeholder';
import { StatusBadge } from '../components/StatusBadge';

export const PlaceholderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 md:p-12 text-slate-800">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
              {EGITIM_APP_META.institution}
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              {EGITIM_APP_META.appName}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge label={EGITIM_APP_META.status} variant="warning" />
          <span className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-600">
            Port :{EGITIM_APP_META.port}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full my-auto py-10">
        <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-sm">
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs tracking-wider uppercase mb-3">
            <Clock className="w-4 h-4" />
            <span>{EGITIM_APP_META.phase}</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Eğitim & Kursiyer Yönetim Platformu
          </h1>

          <p className="text-slate-600 text-base md:text-lg max-w-2xl leading-relaxed mb-8">
            Aday başvurusundan değerlendirmeye, manuel eğitmen yoklamasından ödev revizyonlarına,
            eğitmen mesajlaşmasından doğrulanabilir başarı belgesine uzanan sürecin yönetim altyapısı hazırlandı.
          </p>

          {/* Business rules & Architecture preview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Ayrı ve Bağımsız Uygulama</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  apps/egitim kendine ait router, bağımsız port (:5174) ve kurumsal dashboard diliyle kurulmuştur.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Eğitim Veri Hiyerarşisi</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {EGITIM_APP_META.hierarchy} modeli TypeScript tipleriyle tanımlandı.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">İş Kuralları Koruması</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Manuel yoklama (QR yoklama yok), en az %80 devam, 70/100 ödev eşiği ve nihai admin onayı esas alınacaktır.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Rol Bazlı Yönetim Mimarisi</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Aday, kursiyer, eğitmen, admin ve sistem yöneticisi panelleri kurumsal iş akışlarına göre yapılandırılmıştır.
                </p>
              </div>
            </div>
          </div>

          {/* Road map notice */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users className="w-4 h-4 text-brand-500" />
              <span>Geliştirme Planı: {EGITIM_APP_META.plannedSprint}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Faz 0 İskeleti Hazır
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 {EGITIM_APP_META.institution} — Dijital Platformlar Projesi</p>
        <p className="flex items-center gap-1.5">
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span>Eğitim & Kursiyer Yönetim Portalı</span>
        </p>
      </footer>
    </div>
  );
};
