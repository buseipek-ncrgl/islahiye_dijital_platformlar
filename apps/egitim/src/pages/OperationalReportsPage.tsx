import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  Award,
  Layers,
  FileCheck,
  Info,
  ShieldCheck,
  Clock,
  PieChart,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  calculateOperationalReports,
  generateOperationalReportCSV,
  OperationalReportData,
} from '../services/reportingService';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';
import { getStoredGroups } from '../services/enrollmentStorage';
import { Program, Group } from '../types';
import { KpiStrip } from '../components/ui/KpiStrip';

export const OperationalReportsPage: React.FC = () => {
  const [report, setReport] = useState<OperationalReportData>(() =>
    calculateOperationalReports()
  );
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [programs, setPrograms] = useState<Program[]>(() => getInitialPrograms());
  const groups: Group[] = getStoredGroups();

  // İnteraktif Hover State (Pasta Grafiği Etkileşimi)
  const [hoveredAppSegment, setHoveredAppSegment] = useState<string | null>(null);
  const [hoveredAssignmentSegment, setHoveredAssignmentSegment] = useState<string | null>(null);

  useEffect(() => {
    fetchLivePrograms().then((progs) => {
      if (progs && progs.length > 0) setPrograms(progs);
    });
  }, []);

  const refreshReport = () => {
    setReport(
      calculateOperationalReports({
        programId: programFilter === 'all' ? undefined : programFilter,
        groupId: groupFilter === 'all' ? undefined : groupFilter,
      })
    );
  };

  useEffect(() => {
    refreshReport();
  }, [programFilter, groupFilter]);

  const handleDownloadCSV = () => {
    const csvContent = generateOperationalReportCSV(report);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `islahiye_egitim_operasyonel_rapor_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // =========================================================================
  // GÖRSELLEŞTİRME VE TELEMETRİ HESAPLAMALARI
  // =========================================================================

  const circ = 238.76; // 2 * Math.PI * 38

  // 1. Başvuru Dağılım Oranları ve Dilim Stroke'ları
  const totalApps = report.applications.totalApplications || 1;
  const acceptedApps = report.applications.acceptedCount || 0;
  const underReviewApps = report.applications.underReviewCount || 0;
  const waitlistedApps = report.applications.waitlistedCount || 0;
  const rejectedApps = report.applications.rejectedCount || 0;
  const withdrawnApps = report.applications.withdrawnCount || 0;

  const acceptedPercent = Math.round((acceptedApps / totalApps) * 100);
  const underReviewPercent = Math.round((underReviewApps / totalApps) * 100);
  const waitlistedPercent = Math.round((waitlistedApps / totalApps) * 100);
  const rejectedPercent = Math.round((rejectedApps / totalApps) * 100);
  const withdrawnPercent = Math.max(0, 100 - (acceptedPercent + underReviewPercent + waitlistedPercent + rejectedPercent));

  const appAcceptedStroke = (acceptedPercent / 100) * circ;
  const appUnderReviewStroke = (underReviewPercent / 100) * circ;
  const appWaitlistedStroke = (waitlistedPercent / 100) * circ;
  const appRejectedStroke = (rejectedPercent / 100) * circ;
  const appWithdrawnStroke = (withdrawnPercent / 100) * circ;

  const appUnderReviewOffset = -appAcceptedStroke;
  const appWaitlistedOffset = -(appAcceptedStroke + appUnderReviewStroke);
  const appRejectedOffset = -(appAcceptedStroke + appUnderReviewStroke + appWaitlistedStroke);
  const appWithdrawnOffset = -(appAcceptedStroke + appUnderReviewStroke + appWaitlistedStroke + appRejectedStroke);

  // 2. Devam Halka Grafiği (SVG Donut)
  const avgAttendance = report.attendance.averageAttendanceRate ?? 0;
  const attendanceStroke = (avgAttendance / 100) * circ;

  // 3. Kontenjan Doluluk
  const occupancyRate = report.enrollments.overallCapacityUtilizationRate ?? 0;

  // 4. Ödev Dağılımı ve Dilim Stroke'ları
  const totalSubmissions = report.assignments.totalSubmissions || 1;
  const approvedSubmissions = report.assignments.approvedCount || 0;
  const revisionSubmissions = report.assignments.revisionRequestedCount || 0;
  const pendingSubmissions = report.assignments.pendingEvaluationCount || 0;

  const approvedSubPercent = Math.round((approvedSubmissions / totalSubmissions) * 100);
  const revisionSubPercent = Math.round((revisionSubmissions / totalSubmissions) * 100);
  const pendingSubPercent = Math.max(0, 100 - (approvedSubPercent + revisionSubPercent));

  const subApprovedStroke = (approvedSubPercent / 100) * circ;
  const subRevisionStroke = (revisionSubPercent / 100) * circ;
  const subPendingStroke = (pendingSubPercent / 100) * circ;

  const subRevisionOffset = -subApprovedStroke;
  const subPendingOffset = -(subApprovedStroke + subRevisionStroke);

  // 5. Riskli Kursiyer Sayısı
  const traineesAtRisk = report.attendance.traineesAtRiskCount || 0;
  const totalAssigned = report.enrollments.assignedToGroupCount || 1;
  const safeTraineesCount = Math.max(0, totalAssigned - traineesAtRisk);
  const safePercent = Math.round((safeTraineesCount / totalAssigned) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* ===================================================================== */}
      {/* 1. ÜST BAŞLIK VE RAPOR AKSİYONLARI                                    */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200 print:pb-2">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1">
            2026 Güz Dönemi • Resmî Oda Raporu
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Merkezi Eğitim Operasyon Raporları
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Program başvuru, kontenjan doluluğu, devamlılık, ödev ve başarı metriklerinin resmî dökümleri.
          </p>
        </div>

        {/* Aksiyon Butonları (Yazdır & CSV) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="Rapor çıktısı al veya PDF olarak kaydet"
          >
            <Printer className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Yazdır / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Raporu CSV İndir</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. DÖRT TEMEL GÖSTERGE BANDI (Stripe / Canvas LMS Standart Metrik Bandı) */}
      {/* ===================================================================== */}
      <KpiStrip
        items={[
          {
            label: 'Başvuru Kabul Oranı',
            value: `%${acceptedPercent}`,
            icon: <FileCheck className="w-4 h-4" />,
            subtext: `${acceptedApps} / ${totalApps} Aday kabul edildi`,
          },
          {
            label: 'Kontenjan Doluluğu',
            value: `%${occupancyRate}`,
            icon: <Layers className="w-4 h-4" />,
            subtext: `${report.enrollments.assignedToGroupCount} Atanmış kursiyer`,
          },
          {
            label: 'Devam Ortalaması',
            value: report.attendance.averageAttendanceRate !== null ? `%${avgAttendance}` : 'Hesaplanamıyor',
            icon: <Calendar className="w-4 h-4" />,
            subtext: `${safeTraineesCount} Güvenli (%${safePercent}) • ${traineesAtRisk} Riskli`,
            badge: (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                avgAttendance >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {avgAttendance >= 80 ? 'Baraj Üstü' : 'Takip'}
              </span>
            ),
          },
          {
            label: 'Belge Kütüğü & Tescil',
            value: `${report.successAndCertificates.validCertificatesCount} Belge`,
            icon: <Award className="w-4 h-4" />,
            subtext: `${report.successAndCertificates.academicallyEligibleCount} Hak ediş tescillendi`,
          },
        ]}
      />

      {/* ===================================================================== */}
      {/* 2.5. RESMÎ MEVZUAT VE METODOLOJİ BİLGİ BANDI (TEMİZ AÇIK ZEMİN)        */}
      {/* ===================================================================== */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-xs space-y-2 print:border-slate-300">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Rapor Metodolojisi ve Tanım Ayrımı İlkeleri (Resmî Mevzuat):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            • <strong className="text-slate-800">Kabul Edilmiş Aday ≠ Kesin Kayıt:</strong> Kabul adaya kesin kayıt hakkı verir; evrak teslimi ve onayı ile kesin kayıt oluşur.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            • <strong className="text-slate-800">Kesin Kayıtlı ≠ Gruba Atanmış:</strong> Kursiyerin şube/grup ataması kontenjana göre ayrıca planlanır.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            • <strong className="text-slate-800">Teslim Edilen ≠ Onaylanan:</strong> Kursiyer ödevi revizyon gerektirebilir; geçerlilik eğitmen onayına bağlıdır.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            • <strong className="text-slate-800">Akademik Uygunluk ≠ Nihai Onay:</strong> Şartları sağlayan kursiyer idari onay kütüğüne işlenir.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            • <strong className="text-slate-800">Belge Hakkı ≠ Basılmış PDF:</strong> Belge basımı tekil karekod ve tescil ile tamamlanır.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            • <strong className="text-slate-800">Payda Sıfırsa:</strong> %0 başarı yerine <em>Hesaplanamıyor</em> gösterilir.
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2.6. STANDART FİLTRE ARAÇ ÇUBUĞU (TEK SATIR HİZALAMA)                  */}
      {/* ===================================================================== */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Filtrele:</span>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Tüm Programlar ({programs.length})</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Tüm Gruplar ({groups.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {(programFilter !== 'all' || groupFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setProgramFilter('all');
                setGroupFilter('all');
              }}
              className="h-9 px-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Filtreleri Sıfırla
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Son Hesaplama: {new Date(report.generatedAt).toLocaleTimeString('tr-TR')}</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: BAŞVURU SÜRECİ & İNTERAKTİF PASTA / DONUT GRAFİĞİ          */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">1. Başvuru Süreci ve Durum Dağılımı</h2>
              <p className="text-[11px] text-slate-500">Dilimlerin üzerine gelerek detayları ve oranları inceleyebilirsiniz</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Toplam: {report.applications.totalApplications} Başvuru
          </span>
        </div>

        {/* 2 SÜTUN: SOLDA DONUT, SAĞDA TABLO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* SOL: İNTERAKTİF SVG DONUT CHART */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-xl bg-slate-50/60 border border-slate-200 space-y-4">
            
            {/* SVG DONUT CHART */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100" aria-label="Başvuru Durum Dağılımı Pasta Grafiği">
                {/* Arka Plan Halkası */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" strokeWidth="12" />

                {/* Dilim 1: Kabul Edilen (Yeşil) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={hoveredAppSegment === 'accepted' ? 15 : 12}
                  strokeDasharray={`${appAcceptedStroke} ${circ}`}
                  strokeDashoffset="0"
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredAppSegment('accepted')}
                  onMouseLeave={() => setHoveredAppSegment(null)}
                />

                {/* Dilim 2: İncelemede (Sarı/Amber) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={hoveredAppSegment === 'under_review' ? 15 : 12}
                  strokeDasharray={`${appUnderReviewStroke} ${circ}`}
                  strokeDashoffset={appUnderReviewOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredAppSegment('under_review')}
                  onMouseLeave={() => setHoveredAppSegment(null)}
                />

                {/* Dilim 3: Yedek Liste (Mavi) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={hoveredAppSegment === 'waitlisted' ? 15 : 12}
                  strokeDasharray={`${appWaitlistedStroke} ${circ}`}
                  strokeDashoffset={appWaitlistedOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredAppSegment('waitlisted')}
                  onMouseLeave={() => setHoveredAppSegment(null)}
                />

                {/* Dilim 4: Reddedilen (Kırmızı/Rose) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth={hoveredAppSegment === 'rejected' ? 15 : 12}
                  strokeDasharray={`${appRejectedStroke} ${circ}`}
                  strokeDashoffset={appRejectedOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredAppSegment('rejected')}
                  onMouseLeave={() => setHoveredAppSegment(null)}
                />

                {/* Dilim 5: Geri Çekilen (Gri) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth={hoveredAppSegment === 'withdrawn' ? 15 : 12}
                  strokeDasharray={`${appWithdrawnStroke} ${circ}`}
                  strokeDashoffset={appWithdrawnOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredAppSegment('withdrawn')}
                  onMouseLeave={() => setHoveredAppSegment(null)}
                />
              </svg>

              {/* DİNAMİK MERKEZ ÇAĞRI ALANI */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none">
                {hoveredAppSegment === 'accepted' ? (
                  <>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Kabul Edilen</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight tabular-nums">{acceptedApps}</span>
                    <span className="text-[10px] font-semibold text-slate-500">%{acceptedPercent} Oran</span>
                  </>
                ) : hoveredAppSegment === 'under_review' ? (
                  <>
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">İncelemede</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight tabular-nums">{underReviewApps}</span>
                    <span className="text-[10px] font-semibold text-slate-500">%{underReviewPercent} Oran</span>
                  </>
                ) : hoveredAppSegment === 'waitlisted' ? (
                  <>
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Yedek Liste</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight tabular-nums">{waitlistedApps}</span>
                    <span className="text-[10px] font-semibold text-slate-500">%{waitlistedPercent} Oran</span>
                  </>
                ) : hoveredAppSegment === 'rejected' ? (
                  <>
                    <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Reddedilen</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight tabular-nums">{rejectedApps}</span>
                    <span className="text-[10px] font-semibold text-slate-500">%{rejectedPercent} Oran</span>
                  </>
                ) : hoveredAppSegment === 'withdrawn' ? (
                  <>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Geri Çekilen</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight tabular-nums">{withdrawnApps}</span>
                    <span className="text-[10px] font-semibold text-slate-500">%{withdrawnPercent} Oran</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-black text-slate-900 leading-none tabular-nums">
                      {report.applications.totalApplications}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                      Toplam Başvuru
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      %{acceptedPercent} Kabul
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* LEJANT (NÖTR BEYAZ KARTLARLA TEMİZLEŞTİRİLDİ) */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onMouseEnter={() => setHoveredAppSegment('accepted')}
                onMouseLeave={() => setHoveredAppSegment(null)}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  hoveredAppSegment === 'accepted' ? 'bg-white border-emerald-400 ring-1 ring-emerald-400 shadow-2xs' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-700 text-[11px]">Kabul</span>
                </div>
                <strong className="font-bold text-slate-900 text-[11px] tabular-nums">{acceptedApps}</strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredAppSegment('under_review')}
                onMouseLeave={() => setHoveredAppSegment(null)}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  hoveredAppSegment === 'under_review' ? 'bg-white border-amber-400 ring-1 ring-amber-400 shadow-2xs' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-semibold text-slate-700 text-[11px]">İncelemede</span>
                </div>
                <strong className="font-bold text-slate-900 text-[11px] tabular-nums">{underReviewApps}</strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredAppSegment('waitlisted')}
                onMouseLeave={() => setHoveredAppSegment(null)}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  hoveredAppSegment === 'waitlisted' ? 'bg-white border-blue-400 ring-1 ring-blue-400 shadow-2xs' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-semibold text-slate-700 text-[11px]">Yedek</span>
                </div>
                <strong className="font-bold text-slate-900 text-[11px] tabular-nums">{waitlistedApps}</strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredAppSegment('rejected')}
                onMouseLeave={() => setHoveredAppSegment(null)}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  hoveredAppSegment === 'rejected' ? 'bg-white border-rose-400 ring-1 ring-rose-400 shadow-2xs' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-semibold text-slate-700 text-[11px]">Red</span>
                </div>
                <strong className="font-bold text-slate-900 text-[11px] tabular-nums">{rejectedApps}</strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredAppSegment('withdrawn')}
                onMouseLeave={() => setHoveredAppSegment(null)}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  hoveredAppSegment === 'withdrawn' ? 'bg-white border-slate-400 ring-1 ring-slate-400 shadow-2xs' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 text-[11px]">Geri Çekilen</span>
                </div>
                <strong className="font-bold text-slate-900 text-[11px] tabular-nums">{withdrawnApps}</strong>
              </button>
            </div>
          </div>

          {/* SAĞ: PROGRAM BAZLI DETAY TABLOSU */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Program Bazlı Başvuru ve Kabul Tablosu
              </h3>
              <span className="text-[11px] text-slate-500">{report.applications.byProgram.length} Aktif Program</span>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto relative border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3 bg-slate-50">Eğitim Programı</th>
                    <th className="py-2.5 px-3 text-center bg-slate-50">Toplam</th>
                    <th className="py-2.5 px-3 text-center bg-slate-50">Kabul</th>
                    <th className="py-2.5 px-3 text-center bg-slate-50">İncelemede</th>
                    <th className="py-2.5 px-3 text-center bg-slate-50">Red</th>
                    <th className="py-2.5 px-3 w-36 bg-slate-50">Kabul Oranı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {report.applications.byProgram.map((bp) => {
                    const progAccRate = bp.total > 0 ? Math.round((bp.accepted / bp.total) * 100) : 0;
                    return (
                      <tr key={bp.programId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{bp.programTitle}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{bp.total}</td>
                        <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">{bp.accepted}</td>
                        <td className="py-2.5 px-3 text-center text-amber-700">{bp.underReview}</td>
                        <td className="py-2.5 px-3 text-center text-rose-600">{bp.rejected}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progAccRate}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap min-w-9">
                              %{progAccRate}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: KESİN KAYIT VE KONTENJAN DOLULUK DURUMU                   */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                2. Kesin Kayıt ve Kontenjan Doluluk Durumu
              </h2>
              <p className="text-[11px] text-slate-500">Kesin kayıt adımları ve şube kontenjan kapasiteleri</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Genel Doluluk:{' '}
            {report.enrollments.overallCapacityUtilizationRate !== null
              ? `%${report.enrollments.overallCapacityUtilizationRate}`
              : 'Hesaplanamıyor'}
          </div>
        </div>

        {/* DÖNÜŞÜM ADIMLARI (NÖTR BEYAZ KARTLARLA TEMİZLEŞTİRİLDİ) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">1. Kabul Edilen Aday</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {report.enrollments.acceptedCandidatesCount}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Kayıt hakkı kazanan</span>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">2. Kesin Kayıtlı Kursiyer</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {report.enrollments.confirmedEnrollmentsCount}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">Evrak teslimi tamamlandı</span>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">3. Gruba Atanmış</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {report.enrollments.assignedToGroupCount}
            </div>
            <span className="text-[10px] text-blue-600 mt-0.5 block font-medium">Dersliği ve şubesi belli</span>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">4. Grup Ataması Bekleyen</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {report.enrollments.pendingGroupAssignmentCount}
            </div>
            <span className="text-[10px] text-amber-600 mt-0.5 block font-medium">Şube planlamasında</span>
          </div>
        </div>

        {/* Group Occupancy List with Visual Meter */}
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto relative border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3 bg-slate-50">Grup & Şube</th>
                <th className="py-2.5 px-3 bg-slate-50">Program</th>
                <th className="py-2.5 px-3 text-center bg-slate-50">Kapasite</th>
                <th className="py-2.5 px-3 text-center bg-slate-50">Kayıtlı</th>
                <th className="py-2.5 px-3 w-56 bg-slate-50">Kontenjan Doluluk Çubuğu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {report.enrollments.groupUtilization.map((g) => (
                <tr key={g.groupId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${g.isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span>{g.groupName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{g.programTitle}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">{g.capacity}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-700">{g.assignedCount}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            g.isFull
                              ? 'bg-rose-500'
                              : g.occupancyRate >= 80
                              ? 'bg-emerald-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(g.occupancyRate, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-[11px] text-slate-800 whitespace-nowrap min-w-10">
                        %{g.occupancyRate}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3: OTURUM VE DEVAM İSTATİSTİKLERİ                             */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                3. Oturum ve Devam İstatistikleri
              </h2>
              <p className="text-[11px] text-slate-500">Manuel yoklama sonuçları ve akademik devam baraj uygunluğu</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Ortalama Devam:{' '}
            {report.attendance.averageAttendanceRate !== null
              ? `%${report.attendance.averageAttendanceRate}`
              : 'Hesaplanamıyor'}
          </div>
        </div>

        {/* 2 SÜTUN: SOL SVG DONUT GAUGE, SAĞ RİSK RADARI */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
          {/* Sol: Donut Halka Grafik */}
          <div className="md:col-span-5 flex items-center justify-center gap-5 p-4 rounded-xl bg-slate-50/60 border border-slate-200">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={avgAttendance >= 80 ? '#10B981' : '#F59E0B'}
                  strokeWidth="10"
                  strokeDasharray={`${attendanceStroke} ${circ}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 leading-none tabular-nums">
                  %{avgAttendance}
                </span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">Devam</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-900">Resmî Devam Barajı</div>
              <p className="text-[11px] text-slate-500">Oda mevzuatınca en az %80 devam zorunludur.</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${
                avgAttendance >= 80
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {avgAttendance >= 80 ? '▲ Baraj Güvenli' : '● Takip Gerekli'}
              </span>
            </div>
          </div>

          {/* Sağ: Metrik Kartları (Nötr Beyaz) */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Toplam Oturum</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {report.attendance.totalSessions} Ders
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Planlanan oturumlar</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Yoklaması Alınan</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {report.attendance.completedAttendanceSessions} Oturum
              </div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">Manuel onaylandı</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Yoklaması Açık</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {report.attendance.openAttendanceSessions}
              </div>
              <span className="text-[10px] text-amber-600 mt-0.5 block font-medium">Giriş bekleniyor</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Devam Riski (&lt;%80)</span>
                {report.attendance.traineesAtRiskCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    Takip
                  </span>
                )}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {report.attendance.traineesAtRiskCount} Kursiyer
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Kritik takip seviyesinde</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 4: ÖDEV VE DEĞERLENDİRME DURUMU                               */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                4. Ödev Teslim ve Değerlendirme Durumu
              </h2>
              <p className="text-[11px] text-slate-500">Teslim edilen ödevlerin onay, revizyon ve inceleme dağılımı</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Ödev Not Ortalaması:{' '}
            {report.assignments.overallAverageScore !== null
              ? `${report.assignments.overallAverageScore}/100`
              : 'Hesaplanamıyor'}
          </div>
        </div>

        {/* 2 SÜTUNLU YAPI: SOLDA İNTERAKTİF ÖDEV PASTA GRAFİĞİ, SAĞDA METRİKLER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* SOL: İNTERAKTİF SVG DONUT CHART (ÖDEV YAŞAM DÖNGÜSÜ) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-xl bg-slate-50/60 border border-slate-200 space-y-4">
            
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100" aria-label="Ödev Değerlendirme Dağılım Grafiği">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" strokeWidth="12" />

                {/* Dilim 1: Onaylanan (Yeşil) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={hoveredAssignmentSegment === 'approved' ? 15 : 12}
                  strokeDasharray={`${subApprovedStroke} ${circ}`}
                  strokeDashoffset="0"
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredAssignmentSegment('approved')}
                  onMouseLeave={() => setHoveredAssignmentSegment(null)}
                />

                {/* Dilim 2: Revizyon İstenen (Amber/Sarı) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={hoveredAssignmentSegment === 'revision' ? 15 : 12}
                  strokeDasharray={`${subRevisionStroke} ${circ}`}
                  strokeDashoffset={subRevisionOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredAssignmentSegment('revision')}
                  onMouseLeave={() => setHoveredAssignmentSegment(null)}
                />

                {/* Dilim 3: İnceleme Bekleyen (Mavi) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={hoveredAssignmentSegment === 'pending' ? 15 : 12}
                  strokeDasharray={`${subPendingStroke} ${circ}`}
                  strokeDashoffset={subPendingOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredAssignmentSegment('pending')}
                  onMouseLeave={() => setHoveredAssignmentSegment(null)}
                />
              </svg>

              {/* DİNAMİK MERKEZ HOVER ÇAĞRI ALANI */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none">
                {hoveredAssignmentSegment === 'approved' ? (
                  <>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Onaylanan</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight tabular-nums">{approvedSubmissions}</span>
                    <span className="text-[10px] font-semibold text-slate-500">%{approvedSubPercent} Başarı</span>
                  </>
                ) : hoveredAssignmentSegment === 'revision' ? (
                  <>
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Revizyonda</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight tabular-nums">{revisionSubmissions}</span>
                    <span className="text-[10px] font-semibold text-slate-500">%{revisionSubPercent} Oran</span>
                  </>
                ) : hoveredAssignmentSegment === 'pending' ? (
                  <>
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">İncelemede</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight tabular-nums">{pendingSubmissions}</span>
                    <span className="text-[10px] font-semibold text-slate-500">%{pendingSubPercent} Oran</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-black text-slate-900 leading-none tabular-nums">
                      {report.assignments.totalSubmissions}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                      Toplam Teslim
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      %{approvedSubPercent} Onay
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* LEJANT BUTONLARI (NÖTR BEYAZ KARTLARLA TEMİZLEŞTİRİLDİ) */}
            <div className="w-full grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onMouseEnter={() => setHoveredAssignmentSegment('approved')}
                onMouseLeave={() => setHoveredAssignmentSegment(null)}
                className={`p-2 rounded-lg border text-left transition flex flex-col cursor-pointer ${
                  hoveredAssignmentSegment === 'approved' ? 'bg-white border-emerald-400 ring-1 ring-emerald-400 shadow-2xs' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-700 text-[10px]">Onaylandı</span>
                </div>
                <strong className="font-bold text-slate-900 text-xs mt-0.5 tabular-nums">{approvedSubmissions}</strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredAssignmentSegment('revision')}
                onMouseLeave={() => setHoveredAssignmentSegment(null)}
                className={`p-2 rounded-lg border text-left transition flex flex-col cursor-pointer ${
                  hoveredAssignmentSegment === 'revision' ? 'bg-white border-amber-400 ring-1 ring-amber-400 shadow-2xs' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-semibold text-slate-700 text-[10px]">Revizyon</span>
                </div>
                <strong className="font-bold text-slate-900 text-xs mt-0.5 tabular-nums">{revisionSubmissions}</strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredAssignmentSegment('pending')}
                onMouseLeave={() => setHoveredAssignmentSegment(null)}
                className={`p-2 rounded-lg border text-left transition flex flex-col cursor-pointer ${
                  hoveredAssignmentSegment === 'pending' ? 'bg-white border-blue-400 ring-1 ring-blue-400 shadow-2xs' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-semibold text-slate-700 text-[10px]">İnceleniyor</span>
                </div>
                <strong className="font-bold text-slate-900 text-xs mt-0.5 tabular-nums">{pendingSubmissions}</strong>
              </button>
            </div>
          </div>

          {/* SAĞ: ÖDEV METRİKLERİ VE POLİTİKA KUTULARI */}
          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Yayınlanan Ödev</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                  {report.assignments.totalAssignmentsPublished}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Müfredat görevleri</span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Teslim Edilen</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                  {report.assignments.totalSubmissions}
                </div>
                <span className="text-[10px] text-blue-600 mt-0.5 block font-medium">Kursiyer yüklemeleri</span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Onaylanan</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                  {report.assignments.approvedCount}
                </div>
                <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">Geçerli kabul edildi</span>
              </div>
            </div>

            {/* Eğitmen Değerlendirme Bilgilendirme Kartı (Nötr Açık Zemin) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">Ödev Değerlendirme & Başarı Kuralı:</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Belge tescili için genel ödev ortalamasının en az <strong>70/100</strong> olması ve tüm zorunlu ödevlerin eğitmen tarafından <strong>onaylanmış</strong> olması şarttır. Revizyon aşamasındaki ödevler tamamlanmadan nihai başarı kararı verilemez.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 5: BAŞARI KARARLARI VE DÖNÜŞÜM HUNİSİ (CONVERSION FUNNEL)     */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                5. Dönem Sonu Başarı Kararları ve Belge Kütüğü
              </h2>
              <p className="text-[11px] text-slate-500">Akademik hak edişten kütük tescili ve karekoda dönüşüm hunisi</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Geçerli Belge Sayısı: {report.successAndCertificates.validCertificatesCount}
          </div>
        </div>

        {/* 4 AŞAMALI GÖRSEL DÖNÜŞÜM HUNİSİ (MÜKERRER KARTLAR KALDIRILDI) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1. Aşama</span>
              <span className="w-2 h-2 rounded-full bg-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {report.successAndCertificates.academicallyEligibleCount}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Akademik Uygunluk</div>
              <p className="text-[10px] text-slate-500 mt-1">%80 devam & 70 not barajı sağlandı</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Şartları Sağlayan</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">2. Aşama</span>
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {report.successAndCertificates.approvedDecisionsCount}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Yönetim Onaylı Karar</div>
              <p className="text-[10px] text-amber-700 mt-1 font-medium">
                {report.successAndCertificates.pendingAdminApprovalCount} karar onay masasında bekliyor
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Nihai İdari Karar</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">3. Aşama</span>
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {report.successAndCertificates.issuedCertificatesCount}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Düzenlenen Belge</div>
              <p className="text-[10px] text-slate-500 mt-1">Oda siciline tescil edildi</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>PDF Belge Üretildi</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">4. Aşama</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {report.successAndCertificates.validCertificatesCount}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Aktif Geçerli Kütük</div>
              <p className="text-[10px] text-emerald-700 mt-1 font-medium">
                {report.successAndCertificates.cancelledCertificatesCount > 0
                  ? `${report.successAndCertificates.cancelledCertificatesCount} iptal hariç • Karekodla Doğrulanabilir`
                  : 'Karekod ile %100 doğrulanabilir'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Doğrulanabilir Sicil</span>
              <span className="text-[10px] text-emerald-600 font-bold">%100 Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
