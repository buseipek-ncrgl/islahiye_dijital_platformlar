import React, { useState, useEffect } from 'react';
import {
  Hash,
  Megaphone,
  PlusCircle,
  ShieldAlert,
  CheckCircle,
  Users,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  Channel,
  ChannelMembership,
  ChannelType,
} from '../types';
import {
  getStoredChannels,
  getStoredChannelMemberships,
  createChannel,
  toggleChannelStatus,
  CHANNELS_UPDATE_EVENT,
} from '../services/channelStorage';
import { getStoredGroups } from '../services/enrollmentStorage';

export const AdminChannelsPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const adminId = currentUser?.id || 'user-admin-01';

  const [channels, setChannels] = useState<Channel[]>([]);
  const [memberships, setMemberships] = useState<ChannelMembership[]>([]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalGroupId, setModalGroupId] = useState('');
  const [modalType, setModalType] = useState<ChannelType>('announcement');
  const [modalName, setModalName] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Üyelik Denetim Modalı
  const [inspectedChannel, setInspectedChannel] = useState<Channel | null>(null);

  const groups = getStoredGroups();

  const loadData = () => {
    setChannels(getStoredChannels());
    setMemberships(getStoredChannelMemberships());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener(CHANNELS_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(CHANNELS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const programs = Array.from(new Set(groups.map((g) => g.programTitle)));

  const filteredChannels = channels.filter((c) => {
    if (selectedProgramFilter !== 'all' && c.programTitle !== selectedProgramFilter) return false;
    if (selectedGroupFilter !== 'all' && c.groupId !== selectedGroupFilter) return false;
    return true;
  });

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGroupId) {
      setErrorMsg('Lütfen bir eğitim grubu seçiniz.');
      return;
    }
    if (!modalName.trim()) {
      setErrorMsg('Lütfen kanal adı giriniz.');
      return;
    }

    const group = groups.find((g) => g.id === modalGroupId);
    if (!group) {
      setErrorMsg('Eğitim grubu bulunamadı.');
      return;
    }

    const res = createChannel({
      programId: group.programId,
      termId: group.termId,
      groupId: group.id,
      type: modalType,
      name: modalName,
      description: modalDescription,
      createdBy: adminId,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Kanal oluşturulamadı.');
    } else {
      setShowCreateModal(false);
      setModalName('');
      setModalDescription('');
      setErrorMsg(null);
      setSuccessMsg(`"${modalName}" kanalı başarıyla oluşturuldu.`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleToggleStatus = (chanId: string) => {
    const res = toggleChannelStatus(chanId);
    if (res.success && res.channel) {
      setSuccessMsg(`Kanal durumu "${res.channel.status === 'active' ? 'Aktif' : 'Kapatıldı'}" olarak güncellendi.`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const channelMembers = inspectedChannel
    ? memberships.filter((m) => m.channelId === inspectedChannel.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Ekmek Kırıntısı */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/yonetim" className="hover:text-brand-blue transition-colors">
              Yönetim Masası
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-semibold">Grup İletişim Kanalları</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-navy">Grup Kanal Masası & İdari Ayarlar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Program, dönem ve gruplara bağlı duyuru ile tartışma kanallarının idari yönetimi ve üyelik mutabakatı.
          </p>
        </div>

        <button
          onClick={() => {
            setModalGroupId(groups[0]?.id || '');
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-brand-blue text-white hover:bg-blue-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Yeni Grup Kanalı Aç</span>
        </button>
      </div>

      {/* Mahremiyet & Demo Güvencesi Uyarısı */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-lg p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-semibold">Mahremiyet Kuralı (Sprint E04-A):</span> Yönetici paneli sınıf duyuru ve tartışma kanallarını yapılandırma yetkisine sahiptir; ancak <strong className="text-amber-950">kursiyer–eğitmen arasındaki özel birebir mesaj içeriklerine yönetici erişimi verilmemiştir</strong>. Bu ekran bir frontend demo simülasyonudur.
        </div>
      </div>

      {/* Bildirimler */}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filtreleme Çubuğu */}
      <div className="bg-white rounded-xl border border-brand-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Program:</span>
            <select
              value={selectedProgramFilter}
              onChange={(e) => setSelectedProgramFilter(e.target.value)}
              className="text-xs rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              <option value="all">Tüm Programlar</option>
              {programs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Grup:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="text-xs rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
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

        <span className="text-xs text-slate-500">
          Toplam <strong>{filteredChannels.length}</strong> kanal listelendi
        </span>
      </div>

      {/* Kanal Tablosu */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Kanal Türü & Adı</th>
                <th className="py-3 px-4">Bağlı Program & Grup</th>
                <th className="py-3 px-4">Dönem</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-center">Üyeler</th>
                <th className="py-3 px-4 text-right">İdari İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Kriterlere uygun kanal bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredChannels.map((chan) => {
                  const isAnnounce = chan.type === 'announcement';
                  const isActive = chan.status === 'active';
                  const memCount = memberships.filter((m) => m.channelId === chan.id).length;

                  return (
                    <tr key={chan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`p-1.5 rounded ${
                              isAnnounce
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-brand-blue'
                            }`}
                          >
                            {isAnnounce ? <Megaphone className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <div className="font-bold text-brand-navy">{chan.name}</div>
                            <div className="text-[10px] text-slate-400 max-w-xs truncate">
                              {chan.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{chan.groupName}</div>
                        <div className="text-[10px] text-slate-400">{chan.programTitle}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">{chan.cohortName}</td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isActive ? 'Aktif' : 'Kapatıldı'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setInspectedChannel(chan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-brand-blue" />
                          <span>{memCount} Üye</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(chan.id)}
                          className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                            isActive
                              ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {isActive ? 'Kanalı Kapat' : 'Kanalı Aç'}
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

      {/* YENİ KANAL AÇMA MODALI */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-brand-navy">Yeni Grup Kanalı Tanımla</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bağlı Eğitim Grubu</label>
                <select
                  value={modalGroupId}
                  onChange={(e) => setModalGroupId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.programTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kanal Türü</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer ${
                      modalType === 'announcement'
                        ? 'border-amber-400 bg-amber-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channelType"
                      checked={modalType === 'announcement'}
                      onChange={() => setModalType('announcement')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                        <span>Duyuru Kanalı</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Yalnızca atanan eğitmen yayınlar; kursiyerler salt okur.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer ${
                      modalType === 'discussion'
                        ? 'border-blue-400 bg-blue-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channelType"
                      checked={modalType === 'discussion'}
                      onChange={() => setModalType('discussion')}
                      className="mt-0.5 text-brand-blue"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Tartışma Kanalı</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Tüm grup kursiyerleri ve atanmış eğitmenler katılır.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kanal Adı</label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Örn: Grup A — İhracat Mevzuatı Soru Odası"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Açıklama / Amacı</label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Kanalın kullanım amacını ve kurallarını kısaca belirtin..."
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue resize-none"
                  maxLength={250}
                />
              </div>

              <div className="p-3 bg-slate-50 -mx-5 -mb-5 mt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-brand-blue text-white font-semibold hover:bg-blue-800 shadow-sm"
                >
                  Kanalı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ÜYELİK DENETİM MODALI */}
      {inspectedChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-brand-navy">
                  {inspectedChannel.name} — Üyelik Denetimi
                </h3>
                <p className="text-[11px] text-slate-500">
                  {inspectedChannel.groupName} ({channelMembers.length} Üye)
                </p>
              </div>
              <button
                onClick={() => setInspectedChannel(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
              {channelMembers.length === 0 ? (
                <div className="py-6 text-center text-slate-400">Üye kaydı bulunamadı.</div>
              ) : (
                channelMembers.map((mem) => (
                  <div key={mem.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-800">{mem.participantName}</span>
                      <div className="text-[10px] text-slate-400">
                        {mem.role === 'instructor' ? 'Atanmış Eğitmen' : 'Kayıtlı Kursiyer'} • Katılım:{' '}
                        {new Date(mem.joinedAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mem.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : mem.status === 'transferred'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {mem.status === 'active'
                        ? 'Aktif Üye'
                        : mem.status === 'transferred'
                        ? 'Transfer (Salt Okunur)'
                        : 'İptal Edildi'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setInspectedChannel(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
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
