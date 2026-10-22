import React, { useState, useEffect } from 'react';
import {
  Download,
  Users,
  Calendar,
  Award,
  Layers,
  FileCheck,
  Info,
} from 'lucide-react';
import {
  calculateOperationalReports,
  generateOperationalReportCSV,
  OperationalReportData,
} from '../services/reportingService';
import { DEMO_PROGRAMS } from '../data/educationData';
import { getStoredGroups } from '../services/enrollmentStorage';
import { Program, Group } from '../types';

export const OperationalReportsPage: React.FC = () => {
  const [report, setReport] = useState<OperationalReportData>(() =>
    calculateOperationalReports()
  );
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const programs: Program[] = DEMO_PROGRAMS;
  const groups: Group[] = getStoredGroups();

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
              Operasyonel Raporlama & Analitik
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">Sprint E05-A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Merkezi Eğitim Operasyon Raporları
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sentetik veri depolarından dinamik hesaplanan başvuru, kontenjan, devam, ödev ve başarı metrikleri.
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition flex items-center gap-2 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Raporu CSV İndir (UTF-8 BOM)</span>
        </button>
      </div>

      {/* Critical Semantic Distinctions Banner (Section 12) */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-4 shadow-sm border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-sky-400 font-bold">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Rapor Doğruluğu ve Tanım Ayrımı İlkeleri:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-300">
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            • <strong>Kabul Edilmiş Aday ≠ Kesin Kayıt:</strong> Kabul adaya kesin kayıt hakkı verir; evrak teslimiyle kesin kayıt oluşur.
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            • <strong>Kesin Kayıtlı ≠ Gruba Atanmış:</strong> Kursiyerin şube/grup ataması ayrıca planlanır.
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            • <strong>Teslim Edilen ≠ Onaylanan:</strong> Kursiyer ödevi revizyon gerektirebilir.
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            • <strong>Akademik Uygunluk ≠ Nihai Onay:</strong> Şartları sağlayan kursiyer idari onay bekler.
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            • <strong>Belge Hakkı ≠ Basılmış PDF:</strong> Belge basımı tekil karekod ve tescil ile tamamlanır.
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            • <strong>Payda Sıfırsa:</strong> %0 başarı yerine <em>Hesaplanamıyor</em> gösterilir.
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Program Filtresi:</span>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tüm Programlar</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Grup Filtresi:</span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tüm Gruplar</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Rapor Tarihi: {new Date(report.generatedAt).toLocaleTimeString('tr-TR')}
        </div>
      </div>

      {/* SECTION 1: APPLICATIONS METRICS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">1. Başvuru Süreci ve Durum Dağılımı</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Toplam Başvuru: {report.applications.totalApplications}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">İncelemede</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">
              {report.applications.underReviewCount}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Kabul Edilen</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {report.applications.acceptedCount}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-800 uppercase">Yedek Liste</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5">
              {report.applications.waitlistedCount}
            </div>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-800 uppercase">Reddedilen</div>
            <div className="text-xl font-bold text-rose-700 mt-0.5">
              {report.applications.rejectedCount}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Geri Çekilen</div>
            <div className="text-xl font-bold text-slate-600 mt-0.5">
              {report.applications.withdrawnCount}
            </div>
          </div>
        </div>

        {/* Program Breakdown Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2 px-3">Program</th>
                <th className="py-2 px-3 text-center">Toplam</th>
                <th className="py-2 px-3 text-center">Kabul</th>
                <th className="py-2 px-3 text-center">İncelemede</th>
                <th className="py-2 px-3 text-center">Red</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {report.applications.byProgram.map((bp) => (
                <tr key={bp.programId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{bp.programTitle}</td>
                  <td className="py-2.5 px-3 text-center font-bold">{bp.total}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">{bp.accepted}</td>
                  <td className="py-2.5 px-3 text-center text-amber-700">{bp.underReview}</td>
                  <td className="py-2.5 px-3 text-center text-rose-600">{bp.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: ENROLLMENT & QUOTA UTILIZATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              2. Kesin Kayıt ve Kontenjan Doluluk Durumu
            </h2>
          </div>
          <div className="text-xs font-bold text-indigo-700">
            Genel Doluluk:{' '}
            {report.enrollments.overallCapacityUtilizationRate !== null
              ? `%${report.enrollments.overallCapacityUtilizationRate}`
              : 'Hesaplanamıyor'}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Kabul Edilen Aday</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {report.enrollments.acceptedCandidatesCount}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Kesin Kayıtlı Kursiyer</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {report.enrollments.confirmedEnrollmentsCount}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-800 uppercase">Gruba Atanmış</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5">
              {report.enrollments.assignedToGroupCount}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase">Grup Ataması Bekleyen</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">
              {report.enrollments.pendingGroupAssignmentCount}
            </div>
          </div>
        </div>

        {/* Group Occupancy List */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2 px-3">Grup & Şube</th>
                <th className="py-2 px-3">Program</th>
                <th className="py-2 px-3 text-center">Kapasite</th>
                <th className="py-2 px-3 text-center">Kayıtlı</th>
                <th className="py-2 px-3">Doluluk Grafiği</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {report.enrollments.groupUtilization.map((g) => (
                <tr key={g.groupId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{g.groupName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{g.programTitle}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">{g.capacity}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-700">{g.assignedCount}</td>
                  <td className="py-2.5 px-3 w-48">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            g.isFull ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(g.occupancyRate, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-[11px] text-slate-700 whitespace-nowrap">
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

      {/* SECTION 3: ATTENDANCE & RISK */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              3. Oturum ve Devam İstatistikleri
            </h2>
          </div>
          <div className="text-xs font-bold text-emerald-700">
            Ortalama Devam:{' '}
            {report.attendance.averageAttendanceRate !== null
              ? `%${report.attendance.averageAttendanceRate}`
              : 'Hesaplanamıyor'}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Toplam Oturum</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {report.attendance.totalSessions}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Yoklaması Alınan</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {report.attendance.completedAttendanceSessions}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase">Yoklaması Açık</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">
              {report.attendance.openAttendanceSessions}
            </div>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-800 uppercase">
              Devam Riski Olan (&lt;%80)
            </div>
            <div className="text-xl font-bold text-rose-700 mt-0.5">
              {report.attendance.traineesAtRiskCount} Kursiyer
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ASSIGNMENTS & EVALUATIONS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">
              4. Ödev Teslim ve Değerlendirme Durumu
            </h2>
          </div>
          <div className="text-xs font-bold text-purple-700">
            Ödev Not Ortalaması:{' '}
            {report.assignments.overallAverageScore !== null
              ? `${report.assignments.overallAverageScore}/100`
              : 'Hesaplanamıyor'}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Yayınlanan Ödev</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {report.assignments.totalAssignmentsPublished}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-800 uppercase">Teslim Edilen</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5">
              {report.assignments.totalSubmissions}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Onaylanan</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {report.assignments.approvedCount}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase">Revizyon İstendi</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">
              {report.assignments.revisionRequestedCount}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">İnceleme Bekleyen</div>
            <div className="text-xl font-bold text-slate-700 mt-0.5">
              {report.assignments.pendingEvaluationCount}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: FINAL SUCCESS & CERTIFICATES */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              5. Dönem Sonu Başarı Kararları ve Belge Kütüğü
            </h2>
          </div>
          <div className="text-xs font-bold text-amber-700">
            Geçerli Belge Sayısı: {report.successAndCertificates.validCertificatesCount}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Akademik Uygun</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {report.successAndCertificates.academicallyEligibleCount}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase">Onay Bekleyen</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">
              {report.successAndCertificates.pendingAdminApprovalCount}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Yönetici Onaylı</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {report.successAndCertificates.approvedDecisionsCount}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-800 uppercase">Düzenlenen Belge</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5">
              {report.successAndCertificates.issuedCertificatesCount}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Geçerli Belge</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {report.successAndCertificates.validCertificatesCount}
            </div>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-800 uppercase">İptal Edilen</div>
            <div className="text-xl font-bold text-rose-700 mt-0.5">
              {report.successAndCertificates.cancelledCertificatesCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
