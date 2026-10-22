import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Download,
  Search,
  Filter,
  Lock,
} from 'lucide-react';
import {
  getStoredAuditLogs,
  exportAuditLogsToCSV,
  subscribeToAuditLogUpdates,
} from '../services/auditStorage';
import { AuditLog } from '../types';

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

  const filteredLogs = logs.filter((log) => {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              Merkezi Denetim Kütüğü (Audit Trail)
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">Sprint E05-A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            İdari ve Operasyonel Denetim Kayıtları
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Başvuru kararları, yoklama düzeltmeleri, ödev notları, başarı onayları ve yetki değişikliklerinin tescil kütüğü.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/yonetim/yoklama-denetim')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
          >
            <span>Yoklama Denetimi Masası →</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>CSV Dışa Aktar (UTF-8 BOM)</span>
          </button>
        </div>
      </div>

      {/* Privacy Sanitizer & Integrity Disclaimer */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-4 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Mahremiyet ve Sanitizer Garantisi:</strong> Kayıtlarda parola, T.C. kimlik numarası, gizli not ve özel mesaj metinleri kesinlikle saklanmaz veya dışa aktarılmaz.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 shrink-0 italic">
          * Frontend simülasyonudur. Gerçek WORM güvencesi sunucu tarafı altyapı gerektirir.
        </div>
      </div>

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
            <option value="superadmin">Süper Yönetici</option>
            <option value="admin">Yönetici</option>
            <option value="instructor">Eğitmen</option>
            <option value="applicant">Aday</option>
          </select>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3">Tarih & Saat</th>
                <th className="py-3 px-3">İşlemi Yapan</th>
                <th className="py-3 px-3">İşlem & Olay ID</th>
                <th className="py-3 px-3">Kaynak</th>
                <th className="py-3 px-3">Değişim Özeti</th>
                <th className="py-3 px-3">Gerekçe</th>
                <th className="py-3 px-3 text-right">Detay</th>
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
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            log.actorRole === 'superadmin'
                              ? 'bg-amber-100 text-amber-900'
                              : log.actorRole === 'admin'
                              ? 'bg-purple-100 text-purple-900'
                              : log.actorRole === 'instructor'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.actorRole}
                        </span>
                      </td>

                      {/* Action & Event ID */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-900 font-semibold text-[11px]">
                          {log.action}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.eventId}</div>
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

              <div className="text-[10px] text-slate-400 pt-1">
                Korelasyon ID: <code className="text-slate-600">{selectedLog.correlationId || 'N/A'}</code> • Modül: <code className="text-slate-600">{selectedLog.sourceModule}</code>
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
