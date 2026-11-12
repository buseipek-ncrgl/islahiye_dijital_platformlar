import React, { useState, useMemo } from 'react';
import {
  Utensils,
  ChefHat,
  MapPin,
  BookOpen,
  Plus,
  ExternalLink,
  Layers,
  ArrowRight,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContentRepository } from '../../services/content/contentRepository';
import { CmsContentItem } from '../../types/admin';
import { StatCard } from '../../components/admin/dashboard/StatCard';
import { VerificationHealthWidget } from '../../components/admin/dashboard/VerificationHealthWidget';
import { ContentDistributionWidget } from '../../components/admin/dashboard/ContentDistributionWidget';
import { RecentContentWidget } from '../../components/admin/dashboard/RecentContentWidget';
import { ContentDetailDrawer } from '../../components/admin/content/ContentDetailDrawer';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';

export const AdminDashboardPage: React.FC = () => {
  const { canCreate } = useAdminRole();
  const [selectedDrawerTarget, setSelectedDrawerTarget] = useState<{
    id: string;
    contentType: string;
  } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CmsContentItem | null>(null);
  const {
    contentVersion,
    getDishes,
    getRecipes,
    getPlaces,
    getCulturalStories,
    getFilms,
    getArticles,
    deleteDish,
    deleteRecipe,
    deleteArticle,
    deleteCulturalStory,
    deleteArtisan,
    deletePlace,
    deleteAnnouncement,
    deleteEvent,
    deleteFilm,
    deleteMediaItem,
    deleteAtlasNode,
  } = useContent();

  const stats = useMemo(() => ContentRepository.getStats(), [contentVersion]);
  const allItems = useMemo(() => ContentRepository.getAllItems(), [contentVersion]);
  const selectedItem = useMemo(
    () =>
      selectedDrawerTarget
        ? allItems.find(
            (i) => i.id === selectedDrawerTarget.id && i.contentType === selectedDrawerTarget.contentType
          ) || null
        : null,
    [selectedDrawerTarget, allItems]
  );
  const dishes = useMemo(() => getDishes(false), [getDishes, contentVersion]);
  const recipes = useMemo(() => getRecipes(false), [getRecipes, contentVersion]);
  const places = useMemo(() => getPlaces(false), [getPlaces, contentVersion]);
  const stories = useMemo(() => getCulturalStories(false), [getCulturalStories, contentVersion]);
  const films = useMemo(() => getFilms(false), [getFilms, contentVersion]);
  const articles = useMemo(() => getArticles(false), [getArticles, contentVersion]);

  // Real computed dynamic metrics from live database
  const publishedDishes = useMemo(
    () => dishes.filter((d) => !('publicationStatus' in d) || (d as any).publicationStatus === 'published').length,
    [dishes]
  );
  const officialGiDish = useMemo(
    () => dishes.some((d) => d.id === 'islahiye-biberi' && Boolean(d.isRegisteredGeographicalIndication)),
    [dishes]
  );
  const customGiDishesCount = useMemo(
    () => dishes.filter((d) => Boolean(d.isRegisteredGeographicalIndication)).length,
    [dishes]
  );
  const linkedRecipesCount = useMemo(
    () => recipes.filter((r) => Boolean(r.dishId)).length,
    [recipes]
  );
  const verifiedPlacesCount = useMemo(
    () => places.filter((p) => p.verificationStatus === 'verified').length,
    [places]
  );
  const totalArchiveCount = useMemo(
    () => articles.length + stories.length + films.length,
    [articles, stories, films]
  );

  // Format today's date in Turkish
  const formattedTodayDate = useMemo(() => {
    const now = new Date();
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${days[now.getDay()]}`;
  }, []);

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    switch (itemToDelete.contentType) {
      case 'dish':
        deleteDish(itemToDelete.id);
        break;
      case 'recipe':
        deleteRecipe(itemToDelete.id);
        break;
      case 'news':
        deleteArticle(itemToDelete.id);
        break;
      case 'cultural_story':
        deleteCulturalStory(itemToDelete.id);
        break;
      case 'editorial_article':
        deleteArticle(itemToDelete.id);
        break;
      case 'artisan':
        deleteArtisan(itemToDelete.id);
        break;
      case 'place':
        deletePlace(itemToDelete.id);
        break;
      case 'announcement':
        deleteAnnouncement(itemToDelete.id);
        break;
      case 'event':
        deleteEvent(itemToDelete.id);
        break;
      case 'film':
        deleteFilm(itemToDelete.id);
        break;
      case 'media':
        deleteMediaItem(itemToDelete.id);
        break;
      case 'atlas_node':
        deleteAtlasNode(itemToDelete.id);
        break;
      default:
        break;
    }

    setItemToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. Executive Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1">
            {formattedTodayDate}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gastronomi Yönetim Portalı Genel Bakış
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            İslahiye Ticaret Odası Lezzet Atlası tescilli yöresel yemekleri, ocaklık tarifleri ve saha envanteri.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {canCreate ? (
            <Link
              to="/yonetim/yemekler/yeni"
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Yeni Yemek Ekle</span>
            </Link>
          ) : (
            <span
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200 cursor-not-allowed whitespace-nowrap"
              title="İncelemeci rolünde yeni kayıt oluşturulamaz."
            >
              <span>Yeni Kayıt (Kısıtlı)</span>
            </span>
          )}

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <span>Portalı Gör</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* 2. Top 4 KPI Metric Cards (Grounded in Real Live Database Records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Yöresel Yemekler"
          count={`${dishes.length} Yemek`}
          description={`${publishedDishes} Yayında • ${dishes.length - publishedDishes} Taslak`}
          icon={Utensils}
          badge={dishes.length > 0 ? 'Aktif Menü' : 'Boş Envanter'}
          badgeColor="emerald"
          delta={{
            value: officialGiDish
              ? 'Tescilli (#991)'
              : customGiDishesCount > 0
              ? `${customGiDishesCount} İşaretli`
              : 'Envanter Kayıtlı',
            isPositive: true,
            icon: Award,
          }}
          linkTo="/yonetim/yemekler"
        />

        <StatCard
          title="Geleneksel Tarifler"
          count={`${recipes.length} Reçete`}
          description="Porsiyon ölçekli ocaklık adımları"
          icon={ChefHat}
          badge="Atölye"
          badgeColor="blue"
          delta={{
            value: recipes.length > 0 ? `${linkedRecipesCount}/${recipes.length} Yemek Eşleşti` : 'Kayıt Bekliyor',
            isPositive: true,
            icon: ChefHat,
          }}
          linkTo="/yonetim/tarifler"
        />

        <StatCard
          title="Gastronomi Haritası"
          count={`${places.length} Lezzet Durağı`}
          description="Taş fırın, lokanta ve ocaklar"
          icon={MapPin}
          badge="Saha Haritası"
          badgeColor="emerald"
          delta={{
            value: `${verifiedPlacesCount}/${places.length} Doğrulandı`,
            isPositive: true,
            icon: CheckCircle2,
          }}
          linkTo="/yonetim/harita"
        />

        <StatCard
          title="Mutfak Mirası & Medya"
          count={`${totalArchiveCount} Arşiv`}
          description={`${articles.length} Haber/Yazı • ${films.length} Film/Klip`}
          icon={BookOpen}
          badge="Kültür Belleği"
          badgeColor="purple"
          delta={{
            value: `${articles.length} Editoryal Haber`,
            isPositive: true,
            icon: BookOpen,
          }}
          linkTo="/yonetim/kulturel-miras"
        />
      </div>

      {/* 3. Quick Action Operations Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              Hızlı İşlem Masası
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Sık kullanılan yönetim kısayolları
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {canCreate ? (
            <Link
              to="/yonetim/yemekler/yeni"
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-slate-600 mb-2">
                <Utensils className="w-4 h-4 text-emerald-700" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <div className="font-bold text-slate-800 group-hover:text-emerald-800">
                  Yeni Yemek Tanımla
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Yöresel envantere ekle
                </div>
              </div>
            </Link>
          ) : (
            <div
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 opacity-60 cursor-not-allowed flex flex-col justify-between"
              title="İncelemeci rolünde yeni kayıt oluşturulamaz."
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <Utensils className="w-4 h-4" />
                <span className="text-[10px] font-medium">Yetki Gerekir</span>
              </div>
              <div>
                <div className="font-bold text-slate-600">Yeni Yemek Tanımla</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Salt okunur oturum</div>
              </div>
            </div>
          )}

          {canCreate ? (
            <Link
              to="/yonetim/tarifler/yeni"
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50/40 hover:border-blue-200 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-slate-600 mb-2">
                <ChefHat className="w-4 h-4 text-blue-700" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <div className="font-bold text-slate-800 group-hover:text-blue-800">
                  Yeni Tarif Ekle
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Ölçekli ocaklık adımları
                </div>
              </div>
            </Link>
          ) : (
            <div
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 opacity-60 cursor-not-allowed flex flex-col justify-between"
              title="İncelemeci rolünde yeni kayıt oluşturulamaz."
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <ChefHat className="w-4 h-4" />
                <span className="text-[10px] font-medium">Yetki Gerekir</span>
              </div>
              <div>
                <div className="font-bold text-slate-600">Yeni Tarif Ekle</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Salt okunur oturum</div>
              </div>
            </div>
          )}

          <Link
            to="/yonetim/harita?tab=places"
            className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <div className="font-bold text-slate-800 group-hover:text-emerald-800">
                {canCreate ? 'Mekan & Nokta Ekle' : 'Harita & Duraklar'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {canCreate ? 'Haritaya fırın/lokanta bağla' : 'Harita envanterini incele'}
              </div>
            </div>
          </Link>

          {canCreate ? (
            <Link
              to="/yonetim/kulturel-miras/yeni"
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-purple-50/40 hover:border-purple-200 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-slate-600 mb-2">
                <BookOpen className="w-4 h-4 text-purple-700" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <div className="font-bold text-slate-800 group-hover:text-purple-800">
                  Kültürel Miras Yazısı
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Gelenek ve sözlü bellek
                </div>
              </div>
            </Link>
          ) : (
            <div
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 opacity-60 cursor-not-allowed flex flex-col justify-between"
              title="İncelemeci rolünde yeni kayıt oluşturulamaz."
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-[10px] font-medium">Yetki Gerekir</span>
              </div>
              <div>
                <div className="font-bold text-slate-600">Kültürel Miras Yazısı</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Salt okunur oturum</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Two Column Section: Publication Health + Content Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VerificationHealthWidget stats={stats} />
        <ContentDistributionWidget stats={stats} />
      </div>

      {/* 5. Recent Items Table with Direct Actions */}
      <RecentContentWidget
        items={allItems}
        onSelectItem={(item) =>
          setSelectedDrawerTarget({ id: item.id, contentType: item.contentType })
        }
        onDeleteItem={(item) => setItemToDelete(item)}
      />

      {/* Content Detail Drawer */}
      <ContentDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedDrawerTarget(null)}
      />

      {/* Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Envanter Kaydını Sil"
        message={`"${itemToDelete?.title}" başlıklı kaydı sistemden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
