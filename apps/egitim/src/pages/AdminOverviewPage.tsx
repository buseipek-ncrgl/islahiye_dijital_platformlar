import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, FileText, CheckSquare, Award, ArrowRight, Users, Bell, Mail, ShieldCheck } from 'lucide-react';
import { DEMO_APPLICATIONS, DEMO_GROUPS_SUMMARY } from '../data/educationData';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  getStoredAdminAnnouncements,
  getStoredNotifications,
  getStoredNotificationEvents,
} from '../services/notificationStorage';
import { getStoredEmailQueue } from '../services/massEmailStorage';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  // Bekleyen kararlar listesi (tekrar eden kayıt olmadan, ilk 4 benzersiz aday)
  const pendingApplicants = DEMO_APPLICATIONS.filter((app) => app.status === 'pending').slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500">Yönetici Paneli (/yonetim):</span>
          <h2 className="text-lg font-bold text-brand-textPrimary">Operasyonel Genel Bakış</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">Aktif Dönem: <strong className="text-slate-800">2026 Güz Dönemi</strong></span>
          <StatusBadge label="Sistem Aktif" variant="success" size="sm" />
        </div>
      </div>

      {/* 4 TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Aktif Program & Gruplar</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-brand-textPrimary tabular-nums">4 Program • 8 Grup</div>
            <div className="text-xs text-slate-500 flex items-center gap-1 pt-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Toplam 156 Kayıtlı Kursiyer</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Dönem Başvuruları</span>
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-brand-textPrimary tabular-nums">240 Toplam</div>
            <div className="text-xs text-amber-700 font-semibold pt-1">
              14 İncelenmeyi Bekleyen Başvuru
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Yoklama & Ödev Süreci</span>
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-brand-success tabular-nums">%83 Devam Ort.</div>
            <div className="text-xs text-slate-500 pt-1">
              12 Oturum Manuel Onaylandı
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card
          className="hover:border-blue-400 cursor-pointer transition-all hover:shadow-sm"
          onClick={() => navigate('/yonetim/belgeler')}
        >
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Belge Kütüğü & PDF/QR</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-brand-blue tabular-nums">Belge Masası</div>
            <div className="text-xs text-blue-700 font-semibold pt-1 flex items-center justify-between">
              <span>PDF Üretimi & Karekod</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TWO MAIN OPERATION COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Bekleyen Yönetici Kararları Özeti */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-textPrimary">Bekleyen Yönetici Kararları</h3>
                <p className="text-xs text-brand-textSecondary mt-0.5">
                  Otomatik puan hesaplanmış olup nihai kabul/yedek/ret onayı yönetici kararı beklemektedir.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/yonetim/basvurular')}
              >
                Tümü
              </Button>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              {pendingApplicants.map((app) => (
                <div
                  key={app.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{app.candidateName}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">
                      {app.programTitle}
                    </div>
                    {app.autoScore ? (
                      <div className="text-[10px] text-blue-700 font-semibold">
                        Algoritmik Öneri: {app.autoScore.total} Puan ({app.autoScore.ruleVersion})
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-medium">
                        Ön İnceleme Bekliyor (Sprint E02-B)
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate('/yonetim/basvurular')}
                  >
                    Karar Ver
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Grup Performans ve Devam Dağılımı */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-textPrimary">Grup Performans ve Başarı Dağılımı</h3>
                <p className="text-xs text-brand-textSecondary mt-0.5">
                  Grupların %80 devam barajı ve 70 ödev ortalamasına göre anlık durumu.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/yonetim/denetim')}
                >
                  Yoklama
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/yonetim/odevler')}
                >
                  Ödev Denetimi
                </Button>
              </div>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              {DEMO_GROUPS_SUMMARY.map((grp) => {
                const passAttendance = grp.attendanceAverage >= 80;
                return (
                  <div key={grp.id} className="space-y-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{grp.programTitle}</span>
                      <span className={`text-[11px] font-bold tabular-nums ${passAttendance ? 'text-emerald-700' : 'text-brand-danger'}`}>
                        %{grp.attendanceAverage} Devam • {grp.assignmentAverage} Not
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{grp.groupName} • {grp.instructorName}</span>
                      <span>{grp.traineeCount} Kursiyer</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${passAttendance ? 'bg-emerald-600' : 'bg-red-500'}`}
                        style={{ width: `${grp.attendanceAverage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* İLETİŞİM & BİLDİRİM ALTYAPISI (SPRINT E04-B ÖZETİ) */}
      <Card className="border-slate-200">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">İletişim & Bildirim Altyapısı (Simülasyon Özeti)</h3>
                <p className="text-[11px] text-slate-500">
                  Duyuru yayınları, olay bazlı bildirim havuzu ve toplu e-posta demo işlem geçmişi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Bell className="w-3.5 h-3.5" />}
                onClick={() => navigate('/yonetim/duyurular')}
              >
                Kurumsal Duyurular
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Mail className="w-3.5 h-3.5" />}
                onClick={() => navigate('/yonetim/toplu-eposta')}
              >
                Toplu E-Posta Masası
              </Button>
            </div>
          </div>

          {/* 4 Communication Metric Mini Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Yayımlanan Duyurular</span>
              <div className="text-lg font-extrabold text-slate-900 tabular-nums">
                {getStoredAdminAnnouncements().filter((a) => a.status === 'published').length}
              </div>
              <div className="text-[10px] text-slate-400">Kurum & Program Düzeyi</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Demo Bildirim Havuzu</span>
              <div className="text-lg font-extrabold text-blue-700 tabular-nums">
                {getStoredNotifications().length}
              </div>
              <div className="text-[10px] text-slate-400">Tekil Kişi Kayıtları</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Toplu E-Posta Kuyruğu</span>
              <div className="text-lg font-extrabold text-emerald-700 tabular-nums">
                {getStoredEmailQueue().length}
              </div>
              <div className="text-[10px] text-slate-400">Simüle İşlem Kaydı</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Başarısız Demo Olaylar</span>
              <div className="text-lg font-extrabold text-slate-700 tabular-nums">
                {getStoredNotificationEvents().filter((e) => e.status === 'failed').length}
              </div>
              <div className="text-[10px] text-slate-400">Yeniden Denenebilir</div>
            </div>
          </div>

          {/* Privacy Disclaimer (Section 17 Requirement) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Yönetim Mahremiyeti:</strong> Yöneticiler kursiyer ve eğitmenlerin birebir özel mesajlaşmalarını
              okuyamaz veya personelin iletişim içerikleri üzerinden performans puanlaması yapamaz. Metrikler yalnızca sistem genelindeki
              operasyonel bildirim ve duyuru sayılarını yansıtır.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
