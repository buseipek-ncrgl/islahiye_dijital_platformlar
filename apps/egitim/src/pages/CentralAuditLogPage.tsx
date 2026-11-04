import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Download,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  FileCheck,
  Award,
} from 'lucide-react';
import { KpiStrip } from '../components/ui/KpiStrip';
import {
  getStoredAuditLogs,
  exportAuditLogsToCSV,
  subscribeToAuditLogUpdates,
} from '../services/auditStorage';
import { AuditLog } from '../types';

const AUDIT_ACTION_MAP: Record<string, string> = {
  'criteria.version_published': 'Kriter Seti Yayını',
  'application.created': 'Yeni Başvuru Kaydı',
  'application.evaluated': 'Ön Değerlendirme',
  'application.decision': 'Kabul / Ret Kararı',
  'enrollment.completed': 'Kesin Kayıt Onayı',
  'group.assigned': 'Şube / Grup Ataması',
  'attendance.closed': 'Yoklama Kapatma',
  'attendance.corrected': 'Yoklama Düzeltme',
  'evaluation.graded': 'Ödev Notlandırma',
  'success.approved': 'Dönem Başarı Onayı',
  'certificate.generated': 'Sertifika Üretimi',
  'policy.updated': 'Politika Güncellemesi',
  'user.role_assigned': 'Rol Yetkilendirme',
  'system.reset': 'Sistem Sıfırlama',
};

const AUDIT_MODULE_MAP: Record<string, string> = {
  criteriaRepository: 'Kriter & Puanlama Modülü',
  applicationStorage: 'Başvuru Yönetim Modülü',
  enrollmentStorage: 'Kesin Kayıt & Grup Modülü',
  sessionStorage: 'Oturum & Yoklama Modülü',
  assignmentStorage: 'Ödev & Değerlendirme Modülü',
  successStorage: 'Başarı & Mezuniyet Modülü',
  certificateStorage: 'Belge & Karekod Kütüğü',
  systemSettingsStorage: 'Sistem Politikaları Masası',
  permissionEngine: 'Granüler Yetki Matrisi',
};

const AUDIT_ROLE_MAP: Record<string, string> = {
  superadmin: 'Sistem Yöneticisi',
  admin: 'Eğitim Yöneticisi',
  instructor: 'Eğitmen',
  applicant: 'Aday Başvuru',
  trainee: 'Kayıtlı Kursiyer',
};

export const CentralAuditLogPage: React.FC = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setLogs(getStoredAuditLogs());
    const unsub = subscribeToAuditLogUpdates((newLogs: AuditLog[]) => setLogs(newLogs));
    return () => unsub();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const title = log.resourceTitle || '';
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.reason && log.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.actorName && log.actorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.eventId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesResource = resourceFilter === 'all' || log.resourceType === resourceFilter;
      const matchesRole = roleFilter === 'all' || log.actorRole === roleFilter;

      return matchesSearch && matchesResource && matchesRole;
    });
  }, [logs, searchQuery, resourceFilter, roleFilter]);

  const handleDownloadCSV = () => {
    const csvContent = exportAuditLogsToCSV(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `islahiye_egitim_merkezi_denetim_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Top KPIs
  const totalLogsCount = logs.length;
  const attendanceLogsCount = logs.filter((l) => l.resourceType === 'session' || l.action.includes('attendance')).length;
  const evaluationLogsCount = logs.filter((l) => ['evaluation', 'assignment'].includes(l.resourceType)).length;
  const decisionLogsCount = logs.filter((l) => ['success_decision', 'certificate', 'role_assignment', 'application'].includes(l.resourceType)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            İdari ve Operasyonel Denetim Kayıtları
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Başvuru kararları, yoklama düzeltmeleri, ödev notları, başarı onayları ve yetki değişikliklerinin tescil kütüğü.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/yonetim/yoklama-denetim')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <span>Yoklama Denetimi Masası →</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-2xs whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>CSV Dışa Aktar (UTF-8 BOM)</span>
          </button>
        </div>
      </div>

      {/* 4 TOP KPI METRİK BANDI (Stripe / Canvas LMS Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Denetim İzi',
            value: totalLogsCount,
            icon: <ShieldCheck className="w-4 h-4" />,
            subtext: 'Tescilli idari olay kaydı',
          },
          {
            label: 'Yoklama Düzeltmeleri',
            value: attendanceLogsCount,
            icon: <Calendar className="w-4 h-4" />,
            subtext: 'Gerekçeli yoklama hareketleri',
          },
          {
            label: 'Ödev Değerlendirme',
            value: evaluationLogsCount,
            icon: <FileCheck className="w-4 h-4" />,
            subtext: 'Notlandırma & revizyon',
          },
          {
            label: 'Karar & Belge Tescili',
            value: decisionLogsCount,
            icon: <Award className="w-4 h-4" />,
            subtext: 'Mezuniyet & karekod üretimi',
          },
        ]}
      />

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Kayıt başlığı, olay ID, gerekçe veya aktör ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Kaynaklar</option>
            <option value="application">Başvurular</option>
            <option value="attendance">Yoklama & Devam</option>
            <option value="evaluation">Ödev Değerlendirme</option>
            <option value="success_decision">Başarı Kararı</option>
            <option value="certificate">Belge & QR</option>
            <option value="role_assignment">Rol & Yetki</option>
            <option value="criteria">Kriter Seti</option>
            <option value="system_setting">Sistem Ayarları</option>
            <option value="mass_email">Toplu E-Posta</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Roller</option>
            <option value="superadmin">Sistem Yöneticisi</option>
            <option value="admin">Yönetici</option>
            <option value="instructor">Eğitmen</option>
            <option value="applicant">Aday</option>
          </select>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto relative">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 bg-slate-50">Tarih & Saat</th>
                <th className="py-3 px-3 bg-slate-50">İşlemi Yapan</th>
                <th className="py-3 px-3 bg-slate-50">İşlem & Olay ID</th>
                <th className="py-3 px-3 bg-slate-50">Kaynak</th>
                <th className="py-3 px-3 bg-slate-50">Değişim Özeti</th>
                <th className="py-3 px-3 bg-slate-50">Gerekçe</th>
                <th className="py-3 px-3 text-right bg-slate-50">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Filtre kriterlerine uygun denetim kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      {/* Timestamp */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {new Date(log.timestamp).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{log.actorName || log.actorId}</div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            log.actorRole === 'superadmin'
                              ? 'bg-amber-100 text-amber-900'
                              : log.actorRole === 'admin'
                              ? 'bg-purple-100 text-purple-900'
                              : log.actorRole === 'instructor'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {AUDIT_ROLE_MAP[log.actorRole] || log.actorRole}
                        </span>
                      </td>

                      {/* Action & Event ID */}
                      <td className="py-3 px-3">
                        <div className="text-slate-900 font-semibold text-xs">
                          {AUDIT_ACTION_MAP[log.action] || log.action}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {log.eventId ? log.eventId.replace('evt-aud-seed-', 'LOG-2026-0').toUpperCase() : 'LOG-GENEL'}
                        </div>
                      </td>

                      {/* Resource */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {log.resourceTitle}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.resourceType} • {log.resourceId}
                        </span>
                      </td>

                      {/* State Transition */}
                      <td className="py-3 px-3 max-w-xs">
                        {log.previousStateSummary || log.nextStateSummary ? (
                          <div className="text-[11px] leading-tight space-y-0.5">
                            {log.previousStateSummary && (
                              <div className="text-slate-400 line-through truncate">
                                Önce: {log.previousStateSummary}
                              </div>
                            )}
                            {log.nextStateSummary && (
                              <div className="text-emerald-700 font-medium truncate">
                                Sonra: {log.nextStateSummary}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-3 max-w-xs text-slate-600 text-[11px] line-clamp-2">
                        {log.reason || '—'}
                      </td>

                      {/* Details Modal Trigger */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Denetim Kaydı Detayı</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Olay No:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLog.eventId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Zaman:</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(selectedLog.timestamp).toLocaleString('tr-TR')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Aktör:</span>
                  <span className="text-slate-800 font-medium">
                    {selectedLog.actorName} ({selectedLog.actorRole})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">İşlem Türü:</span>
                  <span className="font-mono text-blue-700 font-bold">{selectedLog.action}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold mb-0.5">
                  Hedef Kaynak:
                </span>
                <div className="font-semibold text-slate-900">{selectedLog.resourceTitle}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Tür: {selectedLog.resourceType} | ID: {selectedLog.resourceId}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold mb-0.5">
                  Resmi Değişiklik Gerekçesi:
                </span>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 border border-slate-200 leading-relaxed">
                  {selectedLog.reason || 'Belirtilmedi'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-rose-700 block uppercase font-bold">Önceki Durum:</span>
                  <span className="text-slate-800 font-medium">
                    {selectedLog.previousStateSummary || 'Yok / Tanımsız'}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">Sonraki Durum:</span>
                  <span className="text-slate-800 font-medium">
                    {selectedLog.nextStateSummary || 'Yok / Değişmedi'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-2">
                <div>
                  İşlem Referansı: <span className="font-semibold text-slate-700 font-mono">{selectedLog.correlationId ? selectedLog.correlationId.replace('corr-', 'TR-REF-').toUpperCase() : 'TR-REF-001'}</span>
                </div>
                <div>
                  Modül: <span className="font-semibold text-slate-700">{AUDIT_MODULE_MAP[selectedLog.sourceModule] || selectedLog.sourceModule}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
