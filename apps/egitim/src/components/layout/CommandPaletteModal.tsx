import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  Award,
  Users,
  Building2,
  Mail,
  MessageSquare,
  Hash,
  SlidersHorizontal,
  TrendingUp,
  ClipboardList,
  Layers,
  User,
  ArrowRight,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { useDemoRole } from './DemoRoleContext';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentRole } = useDemoRole();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via custom event or props if managed locally
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Available commands per role
  const getCommands = (): CommandItem[] => {
    switch (currentRole) {
      case 'superadmin':
      case 'admin':
        return [
          {
            id: 'admin-overview',
            title: 'Genel Bakış & İdari Konsol',
            subtitle: 'Eğitim ve operasyonel yönetim ana masası',
            category: 'Yönetim',
            to: currentRole === 'superadmin' ? '/yonetim/super-admin' : '/yonetim',
            icon: LayoutDashboard,
            keywords: ['anasayfa', 'dashboard', 'özet', 'istatistik'],
          },
          {
            id: 'admin-apps',
            title: 'Başvuru Değerlendirme Masası',
            subtitle: 'Aday başvurularını incele, puanla ve karar ver',
            category: 'Başvuru & Kayıt',
            to: '/yonetim/basvurular',
            icon: ClipboardList,
            keywords: ['başvuru', 'aday', 'puan', 'onay', 'mülakat'],
          },
          {
            id: 'admin-enrollment',
            title: 'Kesin Kayıt Masası',
            subtitle: 'Evrak teslimi, kesin kayıt ve grup atamaları',
            category: 'Başvuru & Kayıt',
            to: '/yonetim/kesin-kayit',
            icon: Users,
            keywords: ['kayıt', 'evrak', 'kursiyer', 'tc'],
          },
          {
            id: 'admin-groups',
            title: 'Grup & Kontenjan Masası',
            subtitle: 'Eğitim şubeleri, eğitmen ve kontenjan yönetimi',
            category: 'Başvuru & Kayıt',
            to: '/yonetim/gruplar',
            icon: Layers,
            keywords: ['grup', 'şube', 'kontenjan', 'sınıf', 'transfer'],
          },
          {
            id: 'admin-facilities',
            title: 'Derslik & Mekân Kataloğu',
            subtitle: 'Fiziksel atölyeler, bilişim laboratuvarları ve takvim',
            category: 'Mekân & Planlama',
            to: '/yonetim/mekanlar',
            icon: Building2,
            keywords: ['derslik', 'salon', 'mutfak', 'atölye', 'laboratuvar', 'mekan'],
          },
          {
            id: 'admin-sessions',
            title: 'Oturum Planlama Masası',
            subtitle: 'Haftalık ders saatleri, derslik ve eğitmen oturumları',
            category: 'Mekân & Planlama',
            to: '/yonetim/oturumlar',
            icon: Calendar,
            keywords: ['oturum', 'saat', 'plan', 'takvim', 'yoklama aç'],
          },
          {
            id: 'admin-attendance-audit',
            title: 'Yoklama Denetimi Masası',
            subtitle: 'Eğitmen yoklama kapanışları ve devam barajı',
            category: 'Eğitim & Başarı',
            to: '/yonetim/yoklama-denetim',
            icon: CheckSquare,
            keywords: ['yoklama', 'devam', 'mazeret', 'denetim'],
          },
          {
            id: 'admin-assignments',
            title: 'Ödev & Değerlendirme Masası',
            subtitle: 'Müfredat ödevleri, teslimler ve revizyon geçmişi',
            category: 'Eğitim & Başarı',
            to: '/yonetim/odevler',
            icon: FileText,
            keywords: ['ödev', 'teslim', 'puan', 'not', 'revizyon'],
          },
          {
            id: 'admin-success',
            title: 'Dönem Başarı Onayı Masası',
            subtitle: 'Akademik uygunluk, devam ve nihai idari onay',
            category: 'Eğitim & Başarı',
            to: '/yonetim/basari-onay',
            icon: Award,
            keywords: ['başarı', 'onay', 'baraj', 'sertifika hakkı'],
          },
          {
            id: 'admin-certificates',
            title: 'Belge Kütüğü & Doğrulama',
            subtitle: 'Karekodlu resmi başarı sertifikaları ve sicil kütüğü',
            category: 'Eğitim & Başarı',
            to: '/yonetim/belgeler',
            icon: Award,
            keywords: ['sertifika', 'belge', 'karekod', 'qr', 'doğrulama'],
          },
          {
            id: 'admin-email',
            title: 'Toplu E-Posta Masası',
            subtitle: 'Şube bazlı toplu duyuru ve e-posta kuyruğu',
            category: 'İletişim',
            to: '/yonetim/toplu-eposta',
            icon: Mail,
            keywords: ['eposta', 'mail', 'toplu', 'duyuru', 'şablon'],
          },
          {
            id: 'admin-reports',
            title: 'Merkezi Operasyonel Raporlar',
            subtitle: 'Başvuru, kontenjan, devam ve ödev metrikleri & CSV',
            category: 'Raporlama',
            to: '/yonetim/raporlar',
            icon: TrendingUp,
            keywords: ['rapor', 'istatistik', 'csv', 'döküm', 'analitik'],
          },
          {
            id: 'admin-users',
            title: 'Kullanıcı & Rol Masası',
            subtitle: 'Kullanıcı profilleri, rol atama ve aktivasyon',
            category: 'Sistem & Güvenlik',
            to: '/yonetim/kullanicilar',
            icon: Users,
            keywords: ['kullanıcı', 'hesap', 'profil', 'yetki'],
          },
          {
            id: 'admin-roles',
            title: 'Granüler Yetki Matrisi',
            subtitle: '24 granüler izin anahtarı ve rol eşleştirmeleri',
            category: 'Sistem & Güvenlik',
            to: '/yonetim/roller',
            icon: SlidersHorizontal,
            keywords: ['rol', 'izin', 'rbac', 'matris'],
          },
          {
            id: 'admin-settings',
            title: 'Sistem Politikaları & Ayarlar',
            subtitle: 'Devam barajı (%80), ödev eşiği (70) ve sistem parametreleri',
            category: 'Sistem & Güvenlik',
            to: '/yonetim/ayarlar',
            icon: SlidersHorizontal,
            keywords: ['ayar', 'politika', 'baraj', 'eşik', 'sürüm'],
          },
        ];

      case 'instructor':
        return [
          {
            id: 'inst-overview',
            title: 'Eğitmen Genel Bakış',
            subtitle: 'Atanmış şubeler, yoklama ve ödev özeti',
            category: 'Eğitim Süreci',
            to: '/egitmen',
            icon: LayoutDashboard,
            keywords: ['dashboard', 'özet', 'kurs'],
          },
          {
            id: 'inst-courses',
            title: 'Derslerim & Manuel Yoklama',
            subtitle: 'Oturum seçimi, katılımcı yoklaması ve ders tamamlama',
            category: 'Eğitim Süreci',
            to: '/egitmen/dersler',
            icon: ClipboardList,
            keywords: ['ders', 'yoklama', 'katıldı', 'oturum'],
          },
          {
            id: 'inst-calendar',
            title: 'Eğitim Takvimim',
            subtitle: 'Haftalık ders programı, derslikler ve oturum saatleri',
            category: 'Eğitim Süreci',
            to: '/egitmen/takvim',
            icon: Calendar,
            keywords: ['takvim', 'hafta', 'saat', 'program'],
          },
          {
            id: 'inst-assignments',
            title: 'Ödev & Değerlendirme Masası',
            subtitle: 'Yeni ödev tanımlama, kursiyer teslimleri ve notlandırma',
            category: 'Eğitim Süreci',
            to: '/egitmen/odevler',
            icon: FileText,
            keywords: ['ödev', 'not', 'puan', 'teslim', 'revizyon'],
          },
          {
            id: 'inst-groups',
            title: 'Gruplarım',
            subtitle: 'Sorumlu olduğunuz eğitim sınıfları ve kursiyer listeleri',
            category: 'Eğitim Süreci',
            to: '/egitmen/gruplar',
            icon: Users,
            keywords: ['grup', 'sınıf', 'kursiyer', 'liste'],
          },
          {
            id: 'inst-progress',
            title: 'Kursiyer Akademik İlerlemesi',
            subtitle: 'Devam oranları ve başarı grafikleri',
            category: 'Eğitim Süreci',
            to: '/egitmen/ilerleme',
            icon: TrendingUp,
            keywords: ['ilerleme', 'başarı', 'grafik', 'devam'],
          },
          {
            id: 'inst-messages',
            title: 'Birebir Mesajlar',
            subtitle: 'Kursiyerler ile soru-cevap ve akademik iletişim',
            category: 'İletişim',
            to: '/egitmen/mesajlar',
            icon: MessageSquare,
            keywords: ['mesaj', 'sohbet', 'kursiyer', 'soru'],
          },
          {
            id: 'inst-channels',
            title: 'Grup Kanalları',
            subtitle: 'Sınıf duyuru panoları ve kaynak paylaşımları',
            category: 'İletişim',
            to: '/egitmen/kanallar',
            icon: Hash,
            keywords: ['kanal', 'paylaşım', 'kaynak', 'grup'],
          },
          {
            id: 'inst-profile',
            title: 'Profilim & Eğitmen Bilgileri',
            subtitle: 'Uzmanlık alanları ve kurumsal iletişim bilgileri',
            category: 'Hesap',
            to: '/egitmen/profil',
            icon: User,
            keywords: ['profil', 'hesap', 'bilgi'],
          },
        ];

      case 'trainee':
        return [
          {
            id: 'trainee-overview',
            title: 'Kursiyer Portalı Genel Bakış',
            subtitle: 'Devam durumu, yaklaşan dersler ve ödev bildirimleri',
            category: 'Eğitim Sürecim',
            to: '/kursiyer',
            icon: LayoutDashboard,
            keywords: ['dashboard', 'özet', 'kursiyer'],
          },
          {
            id: 'trainee-courses',
            title: 'Derslerim & Müfredat',
            subtitle: 'Haftalık oturum konuları ve ders materyalleri',
            category: 'Eğitim Sürecim',
            to: '/kursiyer/dersler',
            icon: BookOpen,
            keywords: ['ders', 'müfredat', 'kaynak', 'konu'],
          },
          {
            id: 'trainee-calendar',
            title: 'Eğitim Takvimi',
            subtitle: 'Ders günleri, salon bilgisi ve saatleri',
            category: 'Eğitim Sürecim',
            to: '/kursiyer/takvim',
            icon: Calendar,
            keywords: ['takvim', 'saat', 'gün', 'oturum'],
          },
          {
            id: 'trainee-assignments',
            title: 'Ödevlerim & Teslim Masası',
            subtitle: 'Zorunlu ödevler, teslim yükleme ve değerlendirme notları',
            category: 'Eğitim Sürecim',
            to: '/kursiyer/odevler',
            icon: CheckSquare,
            keywords: ['ödev', 'teslim', 'not', 'puan', 'revizyon'],
          },
          {
            id: 'trainee-attendance',
            title: 'Devam Durumum',
            subtitle: 'Resmi %80 katılım barajı ve oturum yoklama kayıtları',
            category: 'Eğitim Sürecim',
            to: '/kursiyer/devam',
            icon: ClipboardList,
            keywords: ['devam', 'yoklama', 'katılım', 'baraj'],
          },
          {
            id: 'trainee-certificates',
            title: 'Belgelerim & Karekod Tescili',
            subtitle: 'Katılım ve başarı sertifikaları görüntüleme ve indirme',
            category: 'Eğitim Sürecim',
            to: '/kursiyer/belgeler',
            icon: Award,
            keywords: ['belge', 'sertifika', 'karekod', 'tescil', 'pdf'],
          },
          {
            id: 'trainee-catalog',
            title: 'Eğitim Kataloğu (Tüm Programlar)',
            subtitle: 'İslahiye Ticaret Odası bünyesindeki tüm eğitimleri inceleyin',
            category: 'Programlar & Keşif',
            to: '/kursiyer/katalog',
            icon: BookOpen,
            keywords: ['katalog', 'eğitim', 'program', 'kurs'],
          },
          {
            id: 'trainee-verify',
            title: 'Karekod Belge Doğrulama',
            subtitle: 'Resmi belge doğrulama kodu ve tescil sorgulama',
            category: 'Programlar & Keşif',
            to: '/kursiyer/belge-dogrula',
            icon: Award,
            keywords: ['doğrula', 'karekod', 'kod', 'belge'],
          },
          {
            id: 'trainee-messages',
            title: 'Eğitmen Mesajları',
            subtitle: 'Atanmış eğitmeniniz ile birebir görüşmeler',
            category: 'İletişim',
            to: '/kursiyer/mesajlar',
            icon: MessageSquare,
            keywords: ['mesaj', 'eğitmen', 'soru', 'iletişim'],
          },
          {
            id: 'trainee-channels',
            title: 'Grup Kanallarım',
            subtitle: 'Sınıf arkadaşları ve eğitmen ortak paylaşım kanalı',
            category: 'İletişim',
            to: '/kursiyer/kanallar',
            icon: Hash,
            keywords: ['kanal', 'grup', 'sınıf', 'paylaşım'],
          },
          {
            id: 'trainee-profile',
            title: 'Profilim & Bilgilerim',
            subtitle: 'Kişisel kütük bilgileri ve iletişim tercihleri',
            category: 'Hesap',
            to: '/kursiyer/profil',
            icon: User,
            keywords: ['profil', 'bilgi', 'telefon', 'eposta'],
          },
        ];

      default:
        return [
          {
            id: 'public-catalog',
            title: 'Eğitim Programları Kataloğu',
            subtitle: 'Tüm aktif ve planlanan eğitimleri inceleyin',
            category: 'Eğitim',
            to: '/egitimler',
            icon: BookOpen,
            keywords: ['katalog', 'eğitim', 'kurs'],
          },
          {
            id: 'public-verify',
            title: 'Karekod Belge Doğrulama',
            subtitle: 'Resmi belge kodu sorgulama',
            category: 'Doğrulama',
            to: '/belge-dogrula',
            icon: Award,
            keywords: ['belge', 'doğrula', 'karekod'],
          },
        ];
    }
  };

  const allCommands = getCommands();

  const filteredCommands = allCommands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleSelect = (to: string) => {
    navigate(to);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex].to);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Sayfa, işlem, derslik veya modül adı yazınız..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
              ESC Kapat
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">Eşleşen modül veya sayfa bulunamadı</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Farklı anahtar kelimelerle aramayı deneyebilirsiniz.</p>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              const Icon = cmd.icon;

              return (
                <div
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.to)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-500/20'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold truncate">{cmd.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          isSelected
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cmd.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {cmd.subtitle}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-slate-400">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                        <span>Git</span>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 opacity-40" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-3xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-3xs">↓</kbd>
              <span>Gezin</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-3xs">Enter</kbd>
              <span>Aç</span>
            </span>
          </div>
          <span className="text-slate-400 font-medium">İslahiye Ticaret Odası Hızlı Navigasyon</span>
        </div>
      </div>
    </div>
  );
};
