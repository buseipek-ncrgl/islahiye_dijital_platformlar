import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldAlert,
  RotateCcw,
  Check,
} from 'lucide-react';
import { DEMO_PROGRAMS } from '../data/educationData';
import {
  CriteriaSet,
  Criterion,
  CriterionType,
} from '../types';
import {
  getStoredCriteriaSets,
  getAllVersionsForProgram,
  publishNewCriteriaVersion,
  saveCriteriaSet,
  resetCriteriaToDefaults,
  subscribeToCriteriaUpdates,
} from '../services/evaluationStorage';
import { validateCriteriaWeights } from '../services/criteriaEngine';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { Card, CardContent } from '../components/ui/Card';

export const CriteriaManagementPage: React.FC = () => {
  const [criteriaSets, setCriteriaSets] = useState<CriteriaSet[]>(() =>
    getStoredCriteriaSets()
  );
  const [selectedProgramId, setSelectedProgramId] = useState<string>('prog-01');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  // Sürüm ve kriter güncellemelerine abone ol
  useEffect(() => {
    const unsubscribe = subscribeToCriteriaUpdates((updated) => {
      setCriteriaSets(updated);
    });
    return () => unsubscribe();
  }, []);

  // Seçili programa ait sürümler
  const programVersions = getAllVersionsForProgram(selectedProgramId);
  const activeVersion =
    programVersions.find((v) => v.status === 'active') || programVersions[0];

  // Aktif veya seçili sürüm
  const currentCriteriaSet =
    criteriaSets.find((s) => s.id === selectedVersionId) ||
    activeVersion ||
    criteriaSets[0];

  // Çalışma alanı kriterleri (düzenleme için yerel kopya)
  const [workingCriteria, setWorkingCriteria] = useState<Criterion[]>([]);
  const [activeTab, setActiveTab] = useState<'criteria' | 'thresholds' | 'versions'>('criteria');

  useEffect(() => {
    if (currentCriteriaSet) {
      setWorkingCriteria(JSON.parse(JSON.stringify(currentCriteriaSet.criteria)));
    }
  }, [currentCriteriaSet?.id]);

  // Ağırlık toplamı kontrolü
  const weightValidation = validateCriteriaWeights(workingCriteria);

  // Modal durumları
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');
  const [publishSuccessNotice, setPublishSuccessNotice] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Yeni kriter formu
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<CriterionType>('single_choice');
  const [newWeight, setNewWeight] = useState<number>(20);
  const [newMaxScore, setNewMaxScore] = useState<number>(20);
  const [newIsMandatory, setNewIsMandatory] = useState<boolean>(true);
  const [newIsPrerequisite, setNewIsPrerequisite] = useState<boolean>(false);
  const [newRequiresVerification, setNewRequiresVerification] = useState<boolean>(false);

  // Kriter ağırlığı anlık düzenleme
  const handleWeightChange = (criterionId: string, val: number) => {
    setWorkingCriteria((prev) =>
      prev.map((c) => (c.id === criterionId ? { ...c, weight: val, maxScore: val } : c))
    );
  };

  // Kriter silme
  const handleDeleteCriterion = (criterionId: string) => {
    setWorkingCriteria((prev) => prev.filter((c) => c.id !== criterionId));
  };

  // Yeni kriter ekleme
  const handleAddCriterionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newCrit: Criterion = {
      id: `crit-custom-${Date.now()}`,
      code: newCode.trim().toUpperCase() || `CRIT_${workingCriteria.length + 1}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      programId: selectedProgramId,
      type: newType,
      isMandatory: newIsMandatory,
      weight: newType === 'text' ? 0 : Number(newWeight),
      maxScore: newType === 'text' ? 0 : Number(newMaxScore),
      isPrerequisite: newIsPrerequisite,
      requiresVerification: newRequiresVerification,
      options:
        newType === 'single_choice'
          ? [
              { id: 'opt-1', label: 'Yüksek Düzeyde Uygun', points: Number(newMaxScore) },
              { id: 'opt-2', label: 'Orta Düzeyde Uygun', points: Math.round(Number(newMaxScore) * 0.6) },
              { id: 'opt-3', label: 'Temel Düzeyde Uygun', points: Math.round(Number(newMaxScore) * 0.3) },
            ]
          : undefined,
    };

    setWorkingCriteria((prev) => [...prev, newCrit]);
    setAddModalOpen(false);

    // Formu sıfırla
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
    setNewWeight(20);
    setNewMaxScore(20);
    setNewIsMandatory(true);
    setNewIsPrerequisite(false);
    setNewRequiresVerification(false);
  };

  // Yeni sürüm olarak yayımlama
  const handlePublishNewVersion = () => {
    if (!weightValidation.valid) {
      setPublishError(weightValidation.error || 'Ağırlık toplamı 100 olmalıdır.');
      return;
    }

    const res = publishNewCriteriaVersion(
      selectedProgramId,
      workingCriteria,
      publishNotes.trim() || 'Kriter ağırlıkları ve kuralları güncellendi.'
    );

    if (res.success && res.newSet) {
      setPublishSuccessNotice(
        `Yeni sürüm (${res.newSet.version}) başarıyla yayımlandı ve aktif edildi. Önceki başvuruların değerlendirme kayıtları korundu.`
      );
      setPublishModalOpen(false);
      setPublishNotes('');
      setPublishError(null);
      setSelectedVersionId(res.newSet.id);
    } else {
      setPublishError(res.error || 'Yayımlama başarısız oldu.');
    }
  };

  // Mevcut taslağı kaydetme (sürüm numarası değişmeden)
  const handleSaveWorkingDraft = () => {
    if (!currentCriteriaSet) return;
    const updatedSet: CriteriaSet = {
      ...currentCriteriaSet,
      criteria: workingCriteria,
    };
    saveCriteriaSet(updatedSet);
    setPublishSuccessNotice('Kriter çalışma taslağı kaydedildi.');
    setTimeout(() => setPublishSuccessNotice(null), 3000);
  };

  const getBadgeVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    if (status === 'active') return 'success';
    if (status === 'draft') return 'warning';
    return 'neutral';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Yönetim Masası</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Kriter & Puanlama Motoru</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-textPrimary mt-0.5">
            Dinamik Başvuru Kriterleri & Sürüm Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Program bazlı nesnel değerlendirme kuralları, ağırlık dağılımları ve sürümlü karar algoritmaları.
          </p>
        </div>

        {/* Demo Security & Rules Notice */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Yapay Zekâ Değildir • Açık Kurallı Deterministik Puanlama</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('Tüm kriter setlerini fabrika ayarlarına döndürmek istiyor musunuz?')) {
                resetCriteriaToDefaults();
                window.location.reload();
              }
            }}
            title="Demo Kriter Verilerini Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Program & Version Selector Bar */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Program Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Eğitim Programı:
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value);
                  setSelectedVersionId('');
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {DEMO_PROGRAMS.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.title} ({prog.cohortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Version Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Kriter Sürümü:
              </label>
              <select
                value={currentCriteriaSet?.id || ''}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {programVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.version} — {v.status === 'active' ? 'Yayında (Aktif)' : v.status === 'draft' ? 'Taslak' : 'Arşivlenmiş'} ({v.publishedAt || v.createdAt})
                  </option>
                ))}
              </select>
            </div>

            {/* Version Meta & Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {currentCriteriaSet?.version}
                  </span>
                  <StatusBadge
                    label={
                      currentCriteriaSet?.status === 'active'
                        ? 'Aktif / Yayında'
                        : currentCriteriaSet?.status === 'draft'
                        ? 'Taslak'
                        : 'Arşivlendi'
                    }
                    variant={getBadgeVariant(currentCriteriaSet?.status || 'active')}
                    size="sm"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Yayın: {currentCriteriaSet?.publishedAt || currentCriteriaSet?.createdAt}
                </div>
              </div>

              {currentCriteriaSet?.status === 'active' && (
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Başvurularda Kullanılıyor
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Notification */}
      {publishSuccessNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{publishSuccessNotice}</span>
          </div>
          <button
            onClick={() => setPublishSuccessNotice(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Real-time Weight Sum Progress Monitor */}
      <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        weightValidation.valid
          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
          : 'bg-rose-50 border-rose-200 text-rose-950'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              Aktif Kriter Ağırlık Toplamı: {weightValidation.totalWeight} / 100
            </span>
            {weightValidation.valid ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Tam ve Geçerli (%100)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                Ağırlık Uyuşmazlığı!
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Formül gereği aktif puanlanan kriterlerin ağırlık toplamı tam olarak 100 olmalıdır. Serbest metin gerekçeler (0 puan) ağırlık toplamını etkilemez.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Kriter Ekle</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveWorkingDraft}
            className="flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Taslağı Kaydet</span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setPublishModalOpen(true)}
            disabled={!weightValidation.valid}
            className="flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Yeni Sürüm Olarak Yayınla</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('criteria')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-colors ${
            activeTab === 'criteria'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Kriterler & Puan Kuralları ({workingCriteria.length})
        </button>
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-colors ${
            activeTab === 'thresholds'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tavsiye Eşik Değerleri
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-colors ${
            activeTab === 'versions'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sürüm Tarihçesi ({programVersions.length})
        </button>
      </div>

      {/* TAB 1: CRITERIA LIST */}
      {activeTab === 'criteria' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Kod</th>
                    <th className="py-3.5 px-4">Kriter Başlığı & Açıklaması</th>
                    <th className="py-3.5 px-3">Tip</th>
                    <th className="py-3.5 px-3 text-center">Ön Koşul?</th>
                    <th className="py-3.5 px-3 text-center">Doğrulama?</th>
                    <th className="py-3.5 px-3 text-center w-28">Ağırlık (%)</th>
                    <th className="py-3.5 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {workingCriteria.map((crit) => (
                    <tr key={crit.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-blue text-[11px]">
                        {crit.code}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 leading-tight">
                          {crit.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {crit.description}
                        </div>
                        {crit.options && crit.options.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1.5">
                            {crit.options.map((o) => (
                              <span key={o.id} className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {o.label}: <strong>{o.points}p</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {crit.type === 'single_choice'
                            ? 'Tek Seçim'
                            : crit.type === 'multi_choice'
                            ? 'Çoklu Seçim'
                            : crit.type === 'numeric'
                            ? 'Sayısal Eşik'
                            : crit.type === 'boolean'
                            ? 'Evet / Hayır'
                            : crit.type === 'verified_statement'
                            ? 'Resmi Beyan'
                            : 'Gerekçe Metni'}
                        </span>
                      </td>

                      {/* Prerequisite Flag */}
                      <td className="py-3.5 px-3 text-center">
                        {crit.isPrerequisite ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title="Karşılanmazsa doğrudan incelemeye düşürür">
                            Zorunlu Ön Koşul
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Verification Requirement */}
                      <td className="py-3.5 px-3 text-center">
                        {crit.requiresVerification ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Evrak Doğrulamalı
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Weight Editable */}
                      <td className="py-3.5 px-3 text-center">
                        {crit.type === 'text' ? (
                          <span className="text-slate-400 font-semibold text-[11px]">0 (Öznel)</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={crit.weight}
                              onChange={(e) =>
                                handleWeightChange(crit.id, parseInt(e.target.value) || 0)
                              }
                              className="w-16 h-8 text-center text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue"
                            />
                            <span className="text-slate-400 font-semibold">%</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCriterion(crit.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors text-xs p-1"
                          title="Kriteri Kaldır"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THRESHOLDS */}
      {activeTab === 'thresholds' && (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tavsiye Seviyeleri ve Otomatik Sınıflandırma Eşikleri
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Puanlama motorunun idari yöneticiye sunduğu tavsiye kategorilerinin alt sınırları:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-900">Güçlü Aday</span>
                  <span className="text-lg font-black text-emerald-800">
                    ≥ {currentCriteriaSet.thresholds.strong} Puan
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Tüm ön koşulları sağlamış, yüksek sektörel uyum gösteren ve kontenjan için öncelikli değerlendirilebilecek adaylar.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-900">Değerlendirmeye Uygun</span>
                  <span className="text-lg font-black text-blue-800">
                    {currentCriteriaSet.thresholds.suitable} - {currentCriteriaSet.thresholds.strong - 1} Puan
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Temel kabul kriterlerini sağlayan, asil ve yedek sıralaması için uygun aday grubu.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-900">Ek İnceleme Gerekli</span>
                  <span className="text-lg font-black text-amber-800">
                    &lt; {currentCriteriaSet.thresholds.suitable} Puan
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Puanı alt sınırda kalan veya doğrulanmamış beyanları bulunan, yönetici mülakatı veya evrak teyidi gereken adaylar.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <strong className="text-slate-800 block">Önemli Kural Ayrımı:</strong>
              <p>
                Bu eşikler sistem tarafından asla <strong>otomatik kabul veya ret</strong> üretmez. Karar ancak yetkili yönetici tarafından gerekçelendirilerek verilir.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: VERSION HISTORY */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-200 overflow-hidden shadow-xs">
            {programVersions.map((v) => (
              <div key={v.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {v.title}
                    </span>
                    <StatusBadge
                      label={v.status === 'active' ? 'Aktif Sürüm' : 'Arşivlenmiş Sürüm'}
                      variant={v.status === 'active' ? 'success' : 'neutral'}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {v.description}
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                    <span>Oluşturulma: {v.createdAt}</span>
                    <span>•</span>
                    <span>Yayınlanma: {v.publishedAt || '—'}</span>
                    <span>•</span>
                    <span>Kriter Sayısı: {v.criteria.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={v.id === currentCriteriaSet.id ? 'primary' : 'outline'}
                    onClick={() => setSelectedVersionId(v.id)}
                  >
                    {v.id === currentCriteriaSet.id ? 'Seçili Sürüm' : 'Bu Sürümü İncele'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: YENİ KRİTER EKLE */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Yeni Değerlendirme Kriteri Ekle"
      >
        <form onSubmit={handleAddCriterionSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Kriter Kodu:</label>
              <input
                type="text"
                placeholder="Örn: EXP_03"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-xs uppercase"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Kriter Tipi:</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CriterionType)}
                className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
              >
                <option value="single_choice">Tek Seçim (Açılır Liste)</option>
                <option value="multi_choice">Çoklu Seçim</option>
                <option value="numeric">Sayısal Eşik Değeri</option>
                <option value="boolean">Evet / Hayır</option>
                <option value="verified_statement">Resmi Belge / Beyan</option>
                <option value="text">Açıklama / Gerekçe Metni</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Kriter Başlığı:</label>
            <input
              type="text"
              placeholder="Örn: Bölgesel Tarımsal İnovasyon Deneyimi"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Kriter Açıklaması:</label>
            <textarea
              rows={2}
              placeholder="Kriterin amacını ve değerlendirme yöntemini açıklayınız."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 text-xs resize-none"
            />
          </div>

          {newType !== 'text' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Ağırlık Yüzdesi (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newWeight}
                  onChange={(e) => {
                    const w = parseInt(e.target.value) || 0;
                    setNewWeight(w);
                    setNewMaxScore(w);
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Maksimum Ham Puan:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newMaxScore}
                  onChange={(e) => setNewMaxScore(parseInt(e.target.value) || 0)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsMandatory}
                onChange={(e) => setNewIsMandatory(e.target.checked)}
                className="rounded border-slate-300 text-brand-blue"
              />
              <span className="text-slate-800 font-semibold">Zorunlu Kriter (Aday yanıtlamadan gönderemez)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsPrerequisite}
                onChange={(e) => setNewIsPrerequisite(e.target.checked)}
                className="rounded border-slate-300 text-rose-600"
              />
              <span className="text-rose-900 font-semibold">Ön Koşul Kriteri (Karşılanmazsa doğrudan inceleme gerektirir)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newRequiresVerification}
                onChange={(e) => setNewRequiresVerification(e.target.checked)}
                className="rounded border-slate-300 text-amber-600"
              />
              <span className="text-amber-900 font-semibold">İdari Masada Evrak Doğrulaması Gerektirir</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" size="sm" variant="primary">
              Kriteri Ekle
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: YENİ SÜRÜM YAYINLA */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Yeni Kriter Sürümü Yayımla"
      >
        <div className="space-y-4 text-xs">
          {publishError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1.5 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-brand-blue">
              <ShieldAlert className="w-4 h-4" />
              <span>Sürüm Güvencesi ve Geriye Dönük Koruma</span>
            </div>
            <p>
              Yeni sürüm yayımlandığında mevcut aktif sürüm arşivlenir. <strong>Önceki başvuruların puanları ve değerlendirme kayıtları korunur.</strong> Yeni kriter seti yalnızca bundan sonra iletilecek başvurular için geçerli olur.
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800">Sürüm Değişiklik Notu / Açıklaması:</label>
            <textarea
              rows={3}
              placeholder="Örn: 2026 Güz dönemi tarımsal deneyim ağırlığı %25'ten %30'a yükseltildi."
              value={publishNotes}
              onChange={(e) => setPublishNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handlePublishNewVersion}
            >
              Onayla ve Yeni Sürümü Yayınla
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
