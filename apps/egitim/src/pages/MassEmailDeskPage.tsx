import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Send,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Info,
  X,
  Play,
  Plus,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  MassEmailQueueItem,
  MassEmailTemplate,
} from '../types';
import {
  getStoredEmailTemplates,
  getStoredEmailQueue,
  deriveEligibleRecipients,
  previewEmailWithSample,
  enqueueMassEmail,
  simulateProcessQueueItem,
  cancelMassEmailQueueItem,
  RecipientEntry,
} from '../services/massEmailStorage';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';
import { Program } from '../types';
import { getStoredGroups } from '../services/enrollmentStorage';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';

export const MassEmailDeskPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  // Storage states
  const [templates, setTemplates] = useState<MassEmailTemplate[]>([]);
  const [queue, setQueue] = useState<MassEmailQueueItem[]>([]);

  // Filter & Target states
  const [selectedProgramId, setSelectedProgramId] = useState('prog-01');
  const [selectedTermId] = useState('term-2026-fall');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(['grp-01']);
  const [audienceRole, setAudienceRole] = useState<'trainee' | 'instructor' | 'all'>('trainee');

  // Editor states
  const [selectedTemplateId, setSelectedTemplateId] = useState('tmpl-start-notice');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modal inspection states
  const [inspectItem, setInspectItem] = useState<MassEmailQueueItem | null>(null);
  const [showRecipientListModal, setShowRecipientListModal] = useState(false);

  const [programs, setPrograms] = useState<Program[]>(() => getInitialPrograms());
  const groups = getStoredGroups();

  // Program ID fallback: her zaman geçerli bir program ID'sine bağlanır
  const effectiveProgramId = programs.find((p) => p.id === selectedProgramId)?.id || programs[0]?.id || 'prog-01';
  
  const filteredGroups = useMemo(() => {
    const direct = groups.filter((g) => g.programId === effectiveProgramId);
    if (direct.length > 0) return direct;
    return groups;
  }, [groups, effectiveProgramId]);

  useEffect(() => {
    fetchLivePrograms().then((progs) => {
      if (progs && progs.length > 0) {
        setPrograms(progs);
      }
    });
  }, []);

  // Program listesi güncellendiğinde veya boş seçimde ilk geçerli programı ve grubunu seç
  useEffect(() => {
    if (programs.length > 0 && (!selectedProgramId || !programs.some((p) => p.id === selectedProgramId))) {
      setSelectedProgramId(programs[0].id);
      const firstGroups = groups.filter((g) => g.programId === programs[0].id);
      if (firstGroups.length > 0) {
        setSelectedGroupIds(firstGroups.map((g) => g.id));
      }
    }
  }, [programs, selectedProgramId, groups]);

  useEffect(() => {
    if (filteredGroups.length > 0 && !selectedGroupIds.some((id) => filteredGroups.some((g) => g.id === id))) {
      setSelectedGroupIds(filteredGroups.map((g) => g.id));
    }
  }, [filteredGroups]);

  const loadData = () => {
    const tmpls = getStoredEmailTemplates();
    const q = getStoredEmailQueue();
    setTemplates(tmpls);
    setQueue(q);

    // İlk şablonu yükle
    const initialTmpl = tmpls.find((t) => t.id === 'tmpl-start-notice') || tmpls[0];
    if (initialTmpl && !subject) {
      setSubject(initialTmpl.subject);
      setBody(initialTmpl.body);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Şablon değiştiğinde metin alanlarını doldur
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === 'custom') {
      setSubject('');
      setBody('');
      return;
    }
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  };

  // Dinamik olarak tekil alıcı listesini türet (Deduplication)
  const eligibleRecipients: RecipientEntry[] = deriveEligibleRecipients({
    programId: effectiveProgramId,
    termId: selectedTermId,
    groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
    audienceRole,
  });

  const selectedProgram = programs.find((p) => p.id === effectiveProgramId);
  const selectedGroupNames = groups
    .filter((g) => selectedGroupIds.includes(g.id))
    .map((g) => g.name);

  const sampleGroupName = selectedGroupNames.length > 0
    ? selectedGroupNames.join(', ')
    : (filteredGroups[0]?.name || 'Grup A — Sabah Oturumu');

  const sampleProgramName = selectedProgram?.title || programs[0]?.title || 'İslahiye Biberi & Tarımsal E-Ticaret';
  const sampleRecipient = eligibleRecipients[0] || {
    id: 'usr-sample',
    fullName: 'Ahmet Kaya',
    email: 'ahmet.kaya@islahiye-tso.org.tr',
    role: 'trainee',
  };

  // Canlı Önizleme ve Eksik Değişken Tespiti
  const preview = previewEmailWithSample(
    { subject, body },
    {
      programName: sampleProgramName,
      termName: '2026 Güz Dönemi',
      groupName: sampleGroupName,
      recipientName: sampleRecipient.fullName,
      institutionName: 'İslahiye Ticaret Odası',
      contactInfo: 'egitim@islahiye-tso.org.tr | 0342 862 ** **',
    }
  );

  const handleToggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const handleSelectAllGroups = () => {
    if (selectedGroupIds.length === filteredGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(filteredGroups.map((g) => g.id));
    }
  };

  const handleEnqueue = () => {
    if (!subject.trim() || !body.trim()) {
      setFeedbackMsg('Uyarı: Lütfen e-posta konusu ve mesaj metnini doldurunuz.');
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    if (eligibleRecipients.length === 0) {
      setFeedbackMsg('Uyarı: Seçili filtre kriterlerine uygun hedef alıcı bulunamadı.');
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    const res = enqueueMassEmail({
      createdBy: currentUser.id,
      createdByName: `${currentUser.fullName} (${currentUser.title || 'Yönetici'})`,
      targetProgramId: selectedProgramId,
      targetProgramTitle: selectedProgram?.title,
      targetTermId: selectedTermId,
      targetCohortName: '2026 Güz Dönemi',
      targetGroupIds: selectedGroupIds,
      targetGroupNames: selectedGroupNames,
      targetAudienceRole: audienceRole,
      recipientSnapshot: eligibleRecipients.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        role: r.roleLabel,
        groupName: r.groupName,
      })),
      subject,
      body,
      templateId: selectedTemplateId,
    });

    if (res.success) {
      loadData();
      showFeedback(
        `Toplu e-posta gönderim kuyruğuna alındı (${eligibleRecipients.length} tekil alıcı).`
      );
    }
  };

  const handleSimulateSend = (queueItemId: string) => {
    const res = simulateProcessQueueItem(queueItemId);
    if (res.success) {
      loadData();
      showFeedback('Kuyruktaki ileti başarıyla işlendi ve iletildi.');
    }
  };

  const handleCancelItem = (queueItemId: string) => {
    const reason = prompt('İptal gerekçesini giriniz:', 'Yönetici tarafından gönderim iptal edildi.');
    if (reason) {
      const res = cancelMassEmailQueueItem(queueItemId, reason);
      if (res.success) {
        loadData();
        showFeedback('Kuyruk kaydı iptal edildi.');
      }
    }
  };

  const insertVariable = (label: string) => {
    const token = `[${label}]`;
    setBody((prev) => prev + ' ' + token);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getStatusBadge = (status: MassEmailQueueItem['status']) => {
    switch (status) {
      case 'queued_demo':
        return <StatusBadge label="Kuyrukta" variant="warning" size="sm" />;
      case 'processed_in_simulation':
        return <StatusBadge label="Gönderildi & Arşivlendi" variant="success" size="sm" />;
      case 'cancelled':
        return <StatusBadge label="İptal Edildi" variant="danger" size="sm" />;
      case 'draft':
        return <StatusBadge label="Taslak" variant="neutral" size="sm" />;
      default:
        return <StatusBadge label="İşlendi" variant="info" size="sm" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Toplu E-Posta ve Duyuru Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Program, dönem ve sınıf bazlı toplu e-posta hazırlama, şablon eşleştirme ve gönderim kuyruk yönetimi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Institutional Information Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs leading-relaxed flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Kurumsal İletişim Bilgilendirmesi:</strong> Toplu e-posta iletileri, aktif eğitim dönemindeki kesin kayıtlı kursiyer ve eğitmen gruplarına sistem üzerinden kuyruk mantığıyla iletilir. İletim geçmişi ve gönderim kayıtları aşağıda listelenmektedir.
        </div>
      </div>

      {/* Action Toast Feedback */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Selector & Templates (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Alıcı Hedefleme Masası */}
          <Card>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  1. Hedef Kitle Belirleme
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-[11px]">
                  {eligibleRecipients.length} Tekil Alıcı
                </span>
              </div>

              {/* Program Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Eğitim Programı</label>
                <select
                  value={effectiveProgramId}
                  onChange={(e) => {
                    setSelectedProgramId(e.target.value);
                    const newGroups = groups.filter((g) => g.programId === e.target.value);
                    setSelectedGroupIds(newGroups.map((g) => g.id));
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Groups Checkbox List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Hedef Sınıflar / Gruplar</label>
                  <button
                    type="button"
                    onClick={handleSelectAllGroups}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    {selectedGroupIds.length === filteredGroups.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {filteredGroups.length === 0 ? (
                    <div className="text-slate-400 text-center py-2">Bu programa bağlı grup bulunamadı.</div>
                  ) : (
                    filteredGroups.map((grp) => (
                      <label
                        key={grp.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(grp.id)}
                          onChange={() => handleToggleGroup(grp.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="font-medium text-slate-800">{grp.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Role Category Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Alıcı Kategorisi</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAudienceRole('trainee')}
                    className={`py-1.5 px-2 rounded-md font-semibold text-center transition ${
                      audienceRole === 'trainee'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Kursiyerler
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceRole('instructor')}
                    className={`py-1.5 px-2 rounded-md font-semibold text-center transition ${
                      audienceRole === 'instructor'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Eğitmenler
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceRole('all')}
                    className={`py-1.5 px-2 rounded-md font-semibold text-center transition ${
                      audienceRole === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tümü
                  </button>
                </div>
              </div>

              {/* Deduplication & Count Summary */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{eligibleRecipients.length} Alıcı Listelendi</div>
                  <div className="text-[10px] text-slate-500">Mükerrer ve iptal edilen kayıtlar elendi.</div>
                </div>
                {eligibleRecipients.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRecipientListModal(true)}
                    leftIcon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                  >
                    Alıcıları Gör
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. Şablon Seçimi & Değişken Ekleme */}
          <Card>
            <CardContent className="p-5 space-y-4 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                2. Şablon Seçimi
              </span>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Hazır E-Posta Şablonu</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  <option value="custom">-- Özel Serbest İleti Hazırla --</option>
                </select>
              </div>

              {/* Variable Chips */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Dinamik Etiket Ekle (Tıkla ve Ekle):</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Program Adı' },
                    { label: 'Dönem Adı' },
                    { label: 'Grup Adı' },
                    { label: 'Alıcı Adı' },
                    { label: 'Kurum Adı' },
                    { label: 'İletişim Bilgisi' },
                  ].map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => insertVariable(v.label)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50/80 hover:bg-blue-100/90 text-blue-700 border border-blue-200 text-xs font-semibold transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title={`İleti metnine [${v.label}] etiketini ekler`}
                    >
                      <Plus className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>[{v.label}]</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Message Editor & Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  3. Mesaj Düzenleyici & Canlı Önizleme
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedTemplateId !== 'custom' ? 'Şablon Düzenleme Modu' : 'Özel Mesaj'}
                </span>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">E-Posta Konusu *</label>
                  <span className="text-[11px] text-slate-500">
                    Önizleme: <strong className="text-slate-800">{preview.subject}</strong>
                  </span>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: [Program Adı] — [Dönem Adı] Eğitimleri Başlıyor"
                  spellCheck={false}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">İleti Gövdesi *</label>
                  <span className="text-[11px] text-blue-600">
                    Dinamik etiketler gönderim sırasında otomatik eşleştirilir
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="E-posta metnini buraya yazınız..."
                  spellCheck={false}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-normal focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
                />
              </div>

              {/* Missing Variables Warning (Section 13 Requirement) */}
              {preview.unresolvedVariables.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Eksik / Tanımsız Etiket Tespit Edildi: </span>
                    {preview.unresolvedVariables.map((uv) => (
                      <span key={uv} className="px-2 py-0.5 mx-0.5 rounded bg-amber-200 text-amber-900 font-semibold text-xs">
                        [{uv}]
                      </span>
                    ))}
                    <div className="text-[10px] text-amber-700 mt-0.5">
                      Bu etiketler alıcıya gönderildiğinde çözümlenemeyebilir; lütfen kontrol ediniz.
                    </div>
                  </div>
                </div>
              )}

              {/* Live Preview Box (Gerçek E-Posta İstemcisi Kartı) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Alıcı E-Posta İstemcisi Önizlemesi</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Örnek Alıcı: {sampleRecipient.fullName}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                  {/* Email Header Bar */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {preview.subject || '(Konu Başlığı Belirtilmedi)'}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                        Resmi Bilgilendirme E-Postası
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                          İE
                        </span>
                        <div>
                          <strong className="text-slate-800 font-semibold">Gönderen: </strong>
                          İslahiye Ticaret Odası &lt;egitim@islahiye-tso.org.tr&gt;
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                          {sampleRecipient.fullName ? sampleRecipient.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'AK'}
                        </span>
                        <div>
                          <strong className="text-slate-800 font-semibold">Alıcı: </strong>
                          {sampleRecipient.fullName} &lt;{sampleRecipient.email || 'kursiyer@islahiye-tso.org.tr'}&gt;
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Body Content */}
                  <div className="p-5 text-xs text-slate-800 leading-relaxed font-sans space-y-4">
                    <div className="whitespace-pre-wrap font-normal">
                      {preview.body || '(İleti metni boş)'}
                    </div>

                    {/* Kurumsal İmza Bloğu */}
                    <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1 bg-slate-50/50 -mx-5 -mb-5 p-4">
                      <div className="font-bold text-slate-700">İslahiye Ticaret Odası — Eğitim ve Akademik Programlar Masası</div>
                      <div>İletişim & Destek: egitim@islahiye-tso.org.tr • Tel: 0342 862 ** **</div>
                      <div className="text-[10px] text-slate-400">
                        Bu ileti İslahiye Ticaret Odası Eğitim Portalı tarafından kurumsal bilgilendirme amacıyla iletilmiştir.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enqueue Action Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  variant="primary"
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={handleEnqueue}
                  disabled={eligibleRecipients.length === 0}
                >
                  Kuyruğa Ekle ({eligibleRecipients.length} Alıcı)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QUEUE AUDIT & TRANSMISSION HISTORY TABLE (Section 14 Requirement) */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">E-Posta Kuyruk ve İletim Geçmişi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kuyruğa eklenen işlemler geçmişe kaydedilir ve içeriği sessizce değiştirilemez.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {queue.length} Kuyruk Kaydı
            </span>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto relative rounded-lg border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold bg-slate-50">Kuyruk No & Tarih</th>
                  <th className="py-2.5 px-3 font-semibold bg-slate-50">Konu & Hedef</th>
                  <th className="py-2.5 px-3 font-semibold bg-slate-50">Alıcı Sayısı</th>
                  <th className="py-2.5 px-3 font-semibold bg-slate-50">Durum</th>
                  <th className="py-2.5 px-3 font-semibold text-right bg-slate-50">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-800 font-bold">{item.id}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 line-clamp-1">{item.subject}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.targetProgramTitle || 'Tüm Programlar'} — {item.targetGroupNames.join(', ') || 'Tüm Gruplar'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800 tabular-nums">
                        {item.recipientCount} Kişi
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectItem(item)}
                        >
                          İncele
                        </Button>

                        {item.status === 'queued_demo' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<Play className="w-3 h-3" />}
                              onClick={() => handleSimulateSend(item.id)}
                            >
                              Simüle Et
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCancelItem(item.id)}
                            >
                              İptal
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* RECIPIENTS MODAL */}
      {showRecipientListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Hedef Alıcı Listesi ({eligibleRecipients.length} Tekil Alıcı)
                </h3>
              </div>
              <button onClick={() => setShowRecipientListModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-[360px] overflow-y-auto relative rounded-lg border border-slate-100 text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="p-2 font-semibold bg-slate-50">Ad Soyad</th>
                    <th className="p-2 font-semibold bg-slate-50">Rol</th>
                    <th className="p-2 font-semibold bg-slate-50">Grup</th>
                    <th className="p-2 font-semibold bg-slate-50">E-Posta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eligibleRecipients.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-900">{rec.fullName}</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {rec.roleLabel}
                        </span>
                      </td>
                      <td className="p-2 text-slate-600">{rec.groupName}</td>
                      <td className="p-2 font-mono text-slate-500">{rec.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowRecipientListModal(false)}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT QUEUE ITEM MODAL */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Kuyruk Kaydı Detayı ({inspectItem.id})</h3>
              <button onClick={() => setInspectItem(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Durum:</span>
                {getStatusBadge(inspectItem.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Oluşturan:</span>
                <span className="font-bold text-slate-800">{inspectItem.createdByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Alıcı Sayısı:</span>
                <span className="font-bold text-slate-800">{inspectItem.recipientCount} Kişi</span>
              </div>
              {inspectItem.simulatedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">İşlem Zamanı:</span>
                  <span className="font-bold text-emerald-700">
                    {new Date(inspectItem.simulatedAt).toLocaleString('tr-TR')}
                  </span>
                </div>
              )}
              {inspectItem.cancellationReason && (
                <div className="flex justify-between text-red-700">
                  <span>İptal Gerekçesi:</span>
                  <span className="font-bold">{inspectItem.cancellationReason}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">Konu: {inspectItem.subject}</div>
              <div className="text-slate-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {inspectItem.body}
              </div>
            </div>

            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
              {inspectItem.notes || 'Toplu e-posta işlemi kuyrukta başarıyla işlendi.'}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setInspectItem(null)}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
