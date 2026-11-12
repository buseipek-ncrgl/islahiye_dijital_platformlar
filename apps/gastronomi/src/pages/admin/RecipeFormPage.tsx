import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Check,
  Trash2,
  AlertCircle,
  Eye,
  Plus,
  ArrowUp,
  ArrowDown,
  Info,
  ChefHat,
  Utensils,
  Lightbulb,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';
import { DishCategory, Recipe, ScalableIngredient, RecipeStep, PublicationStatus } from '../../types';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { ImageUploadField } from '../../components/admin/common/ImageUploadField';
import { FormNotificationToast, FormNotification } from '../../components/admin/common/FormNotificationToast';
import { QuickCategoryButton } from '../../components/admin/common/QuickCategoryButton';
import { mergeCategoryOption } from '../../data/categories';

export const RecipeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecipeById, getDishes, saveRecipe, deleteRecipe, getCategories, getCategoryLabel } = useContent();
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();

  const isEditing = Boolean(id);
  const canSave = isEditing ? canEdit : canCreate;
  const existingRecipe = useMemo(() => (id ? getRecipeById(id) : undefined), [id, getRecipeById]);
  const availableDishes = getDishes();
  const initializedKeyRef = useRef<string | null>(null);

  // Recipe Main Fields
  const [dishId, setDishId] = useState<string>('');
  const [dishCategory, setDishCategory] = useState<Exclude<DishCategory, 'all'>>('main');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [baseServings, setBaseServings] = useState<number>(4);
  const [prepTime, setPrepTime] = useState('20 dk');
  const [cookTime, setCookTime] = useState('45 dk');
  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Ustalık Gerektirir'>('Orta');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('/images/islahiye_tava.jpg');
  const [imageCaption, setImageCaption] = useState('');
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>(() =>
    canPublish ? 'published' : 'draft'
  );

  // Ingredients State
  const [ingredients, setIngredients] = useState<ScalableIngredient[]>([
    {
      id: 'ing-1',
      name: 'Kuzu kuşbaşı',
      baseAmount: 600,
      unit: 'g',
      fallbackDisplay: '600 g',
      isScalable: true,
    },
    {
      id: 'ing-2',
      name: 'İslahiye pul biberi',
      baseAmount: 2,
      unit: 'tatlı kaşığı',
      fallbackDisplay: '2 tatlı kaşığı',
      isScalable: true,
    },
  ]);

  // Steps State
  const [steps, setSteps] = useState<RecipeStep[]>([
    {
      stepNumber: 1,
      title: 'Malzemelerin Hazırlanması',
      instruction: 'Malzemeler oda sıcaklığına getirilir, fırın veya ocaklık ısıtılır.',
      tip: 'Etlerin suyunu bırakmaması için yüksek ısıda mühürleme yapılmalıdır.',
    },
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [previewServings, setPreviewServings] = useState<number>(4);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<FormNotification | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Smooth scroll and focus on missing/invalid input field
  const scrollToField = (fieldName: string) => {
    setActiveTab('form');
    setTimeout(() => {
      const element = document.getElementById(`field-${fieldName}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input =
          element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT'
            ? element
            : element.querySelector('input, textarea, select');
        if (input) {
          (input as HTMLElement).focus();
        }
        element.classList.add('ring-4', 'ring-rose-500/40', 'transition-all');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-rose-500/40');
        }, 2500);
      }
    }, 120);
  };

  // Populate if editing or cleanly reset when switching back to create mode
  useEffect(() => {
    if (isEditing && id) {
      if (existingRecipe) {
        if (initializedKeyRef.current !== existingRecipe.id) {
          initializedKeyRef.current = existingRecipe.id;
          const linkedDish = availableDishes.find((d) => d.id === existingRecipe.dishId);
          setDishId(existingRecipe.dishId || '');
          setDishCategory(existingRecipe.dishCategory || linkedDish?.category || 'main');
          setTitle(existingRecipe.title);
          setSubtitle(existingRecipe.subtitle || '');
          setBaseServings(existingRecipe.baseServings || 4);
          setPrepTime(existingRecipe.prepTime || '20 dk');
          setCookTime(existingRecipe.cookTime || '45 dk');
          setDifficulty(existingRecipe.difficulty || 'Orta');
          setNotes(existingRecipe.notes || '');
          setImageUrl(existingRecipe.imageUrl || '/images/islahiye_tava.jpg');
          setImageCaption(existingRecipe.imageCaption || '');
          setIngredients(existingRecipe.ingredients || []);
          setSteps(existingRecipe.steps || []);
          setPublicationStatus(existingRecipe.publicationStatus || 'published');
          setPreviewServings(existingRecipe.baseServings || 4);
          setIsDirty(false);
          setErrors({});
          setActiveTab('form');
        }
      } else if (initializedKeyRef.current !== id) {
        initializedKeyRef.current = id;
        setNotification({
          type: 'error',
          message: 'Tarif kaydı bulunamadı.',
        });
        setTimeout(() => navigate('/yonetim/tarifler'), 1200);
      }
    } else if (!isEditing && initializedKeyRef.current !== '__create__') {
      initializedKeyRef.current = '__create__';
      setDishId('');
      setDishCategory('main');
      setTitle('');
      setSubtitle('');
      setBaseServings(4);
      setPrepTime('20 dk');
      setCookTime('45 dk');
      setDifficulty('Orta');
      setNotes('');
      setImageUrl('/images/islahiye_tava.jpg');
      setImageCaption('');
      setIngredients([
        {
          id: 'ing-1',
          name: 'Kuzu kuşbaşı',
          baseAmount: 600,
          unit: 'g',
          fallbackDisplay: '600 g',
          isScalable: true,
        },
        {
          id: 'ing-2',
          name: 'İslahiye pul biberi',
          baseAmount: 2,
          unit: 'tatlı kaşığı',
          fallbackDisplay: '2 tatlı kaşığı',
          isScalable: true,
        },
      ]);
      setSteps([
        {
          stepNumber: 1,
          title: 'Malzemelerin Hazırlanması',
          instruction: 'Malzemeler oda sıcaklığına getirilir, fırın veya ocaklık ısıtılır.',
          tip: 'Etlerin suyunu bırakmaması için yüksek ısıda mühürleme yapılmalıdır.',
        },
      ]);
      setPublicationStatus(canPublish ? 'published' : 'draft');
      setPreviewServings(4);
      setIsDirty(false);
      setErrors({});
      setActiveTab('form');
    }
  }, [existingRecipe, isEditing, id, availableDishes, canPublish, navigate]);

  // When linked dish changes, update category/default image only when helpful
  const handleDishChange = (selectedDishId: string) => {
    setDishId(selectedDishId);
    setIsDirty(true);
    const dish = availableDishes.find((d) => d.id === selectedDishId);
    if (dish) {
      setDishCategory(dish.category);
      if (!isEditing && !title.trim()) {
        setTitle(`${dish.name} Tarifi`);
        setImageUrl(dish.imageUrl);
      }
    }
  };

  // Ingredient Helpers
  const addIngredient = () => {
    const newId = `ing-${Date.now()}`;
    setIngredients([
      ...ingredients,
      {
        id: newId,
        name: '',
        baseAmount: 1,
        unit: 'adet',
        fallbackDisplay: '1 adet',
        isScalable: true,
      },
    ]);
    setIsDirty(true);
  };

  const removeIngredient = (idToRemove: string) => {
    if (ingredients.length <= 1) {
      setNotification({ type: 'error', message: 'Tarifte en az bir malzeme kalmalıdır.' });
      return;
    }
    setIngredients(ingredients.filter((i) => i.id !== idToRemove));
    setIsDirty(true);
  };

  const updateIngredient = (idToUpdate: string, field: keyof ScalableIngredient, value: any) => {
    setIngredients(
      ingredients.map((item) => {
        if (item.id === idToUpdate) {
          const updated = { ...item, [field]: value };
          if (field === 'baseAmount' || field === 'unit') {
            const amount = field === 'baseAmount' ? value : item.baseAmount;
            const unit = field === 'unit' ? value : item.unit;
            updated.fallbackDisplay = `${amount} ${unit}`;
          }
          return updated;
        }
        return item;
      })
    );
    setIsDirty(true);
  };

  // Step Helpers
  const addStep = () => {
    const nextNumber = steps.length + 1;
    setSteps([
      ...steps,
      {
        stepNumber: nextNumber,
        title: `Adım ${nextNumber}`,
        instruction: '',
        tip: '',
      },
    ]);
    setIsDirty(true);
  };

  const removeStep = (stepNumber: number) => {
    if (steps.length <= 1) {
      setNotification({ type: 'error', message: 'Tarifte en az bir yapılış adımı kalmalıdır.' });
      return;
    }
    const filtered = steps.filter((s) => s.stepNumber !== stepNumber);
    const reindexed = filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(reindexed);
    setIsDirty(true);
  };

  const updateStep = (stepNumber: number, field: keyof RecipeStep, value: any) => {
    setSteps(
      steps.map((s) => (s.stepNumber === stepNumber ? { ...s, [field]: value } : s))
    );
    setIsDirty(true);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    const reindexed = next.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(reindexed);
    setIsDirty(true);
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldDetails: { name: string; label: string; message: string }[] = [];

    if (!title.trim() || title.trim().length < 3) {
      const msg = 'Tarif başlığı en az 3 karakter olmalıdır.';
      newErrors.title = msg;
      fieldDetails.push({ name: 'title', label: 'Tarif Başlığı', message: msg });
    }
    // If dishId is not set, a new dish will automatically be created upon save.
    if (ingredients.length < 2) {
      const msg = 'Tarifte en az 2 malzeme tanımlanmalıdır.';
      newErrors.ingredients = msg;
      fieldDetails.push({ name: 'ingredients', label: 'Malzeme Listesi', message: msg });
    } else if (ingredients.some((i) => !i.name.trim())) {
      const msg = 'Tüm malzemelerin isimleri doldurulmalıdır.';
      newErrors.ingredients = msg;
      fieldDetails.push({ name: 'ingredients', label: 'Malzeme İsimleri', message: msg });
    }
    if (steps.length < 1) {
      const msg = 'Tarifte en az 1 yapılış adımı bulunmalıdır.';
      newErrors.steps = msg;
      fieldDetails.push({ name: 'steps', label: 'Yapılış Adımları', message: msg });
    } else if (steps.some((s) => !s.instruction.trim())) {
      const msg = 'Tüm adımların talimat metinleri doldurulmalıdır.';
      newErrors.steps = msg;
      fieldDetails.push({ name: 'steps', label: 'Adım Talimatları', message: msg });
    }

    setErrors(newErrors);

    if (fieldDetails.length > 0) {
      setActiveTab('form');
      setNotification({
        type: 'error',
        title: `${fieldDetails.length} Alanda Eksiklik Bulundu`,
        message: 'Kaydetme işleminin tamamlanması için lütfen eksik alanları doldurunuz.',
        fields: fieldDetails,
        onScrollToField: scrollToField,
      });

      scrollToField(fieldDetails[0].name);
      return false;
    }

    return true;
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!canSave) {
      setNotification({
        type: 'error',
        title: 'Yetki Yetersiz',
        message: 'Aktif rolünüzle tarif kaydı oluşturma veya düzenleme yetkisine sahip değilsiniz.',
      });
      return;
    }

    if (!validate()) {
      return;
    }

    const requestedStatus = targetStatus || publicationStatus;
    const finalStatus: PublicationStatus =
      !canPublish && (requestedStatus === 'published' || requestedStatus === 'archived')
        ? 'in_review'
        : requestedStatus;
    const finalDishId = dishId || `dish-${Date.now().toString(36)}`;
    const recipeId =
      isEditing && existingRecipe
        ? existingRecipe.id
        : `recipe-${finalDishId}-${Date.now().toString(36)}`;

    const updatedRecipe: Recipe = {
      id: recipeId,
      dishId: finalDishId,
      dishCategory,
      title: title.trim(),
      subtitle: subtitle.trim(),
      baseServings: Number(baseServings) || 4,
      prepTime,
      cookTime,
      difficulty,
      notes: notes.trim(),
      imageUrl,
      imageAlt: title,
      imageCaption: imageCaption.trim() || `${title} pişirme ve hazırlık süreci.`,
      ingredients,
      steps,
      publicationStatus: finalStatus,
    };

    const ok = saveRecipe(updatedRecipe);
    if (!ok) {
      setNotification({
        type: 'error',
        title: 'Kayıt Hatası',
        message: 'Tarif yerel depoya kaydedilemedi. Depolama alanını kontrol edin.',
      });
      return;
    }

    setIsDirty(false);
    setPublicationStatus(finalStatus);
    setNotification({
      type: 'success',
      message:
        finalStatus === 'published'
          ? 'Tarif başarıyla kaydedildi ve Tarif Atölyesinde yayına alındı.'
          : finalStatus === 'in_review'
          ? 'Tarif inceleme onayına gönderildi (henüz yayında değil).'
          : finalStatus === 'archived'
          ? 'Tarif arşivlendi ve atölyeden kaldırıldı.'
          : 'Tarif taslak olarak kaydedildi (ziyaretçilere kapalıdır).',
    });

    setTimeout(() => {
      navigate('/yonetim/tarifler');
    }, 700);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (existingRecipe) {
      deleteRecipe(existingRecipe.id);
      setShowDeleteModal(false);
      navigate('/yonetim/tarifler');
    }
  };

  const effectiveSaveStatus: PublicationStatus =
    !canPublish && (publicationStatus === 'published' || publicationStatus === 'archived')
      ? 'in_review'
      : publicationStatus;

  const primaryButtonLabel =
    effectiveSaveStatus === 'published'
      ? 'Kaydet ve Yayımla'
      : effectiveSaveStatus === 'in_review'
      ? 'İncelemeye Gönder'
      : effectiveSaveStatus === 'archived'
      ? 'Arşivle ve Kaydet'
      : 'Taslağı Kaydet';

  const scaleRatio = previewServings / (baseServings || 4);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/tarifler"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs"
            title="Tarif Listesine Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {isEditing ? (title ? `Tarif Düzenle: ${title}` : 'Tarif Düzenleme') : 'Yeni Mutfak Tarifi Tanımla'}
              </h1>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                  publicationStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : publicationStatus === 'in_review'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : publicationStatus === 'archived'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {publicationStatus === 'published'
                  ? 'Yayında'
                  : publicationStatus === 'in_review'
                  ? 'İncelemede'
                  : publicationStatus === 'archived'
                  ? 'Arşivde'
                  : 'Taslak'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Ölçekli porsiyon adımlarını, usta püf noktalarını ve ocaklık hazırlıklarını güncelleyin.'
                : 'İslahiye geleneksel mutfağına ait yeni porsiyon ölçekli reçete hazırlayın.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{Object.keys(errors).length} eksik alan</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>{activeTab === 'form' ? 'Atölye Önizlemesi' : 'Forma Dön'}</span>
          </button>

          {canSave && publicationStatus !== 'draft' && (
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>Taslak Sakla</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canSave}
            onClick={() => handleSave()}
            title={!canSave ? 'Aktif rolünüzle kayıt kaydedemezsiniz' : undefined}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-2xs disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{primaryButtonLabel}</span>
          </button>

          {isEditing && canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
              title="Tarifi Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Viewport Toast for Notifications & Validation */}
      <FormNotificationToast notification={notification} onClose={() => setNotification(null)} />

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Tarifte kaydedilmemiş düzenlemeleriniz bulunmaktadır.</span>
        </div>
      )}

      {/* Main Tab Switch */}
      {activeTab === 'preview' ? (
        /* Preview / Scale Test */
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {title || 'Tarif Başlığı'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>

            {/* Interactive Servings Scaler */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 pl-2">Porsiyon Testi:</span>
              {[2, 4, 6, 8].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreviewServings(s)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    previewServings === s
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ingredients Scaled */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
                <Utensils className="w-4 h-4 text-emerald-700" />
                <span>Malzemeler ({previewServings} Kişilik Hesaplama)</span>
              </div>
              <ul className="space-y-2 text-xs divide-y divide-slate-100">
                {ingredients.map((ing) => {
                  const displayAmount =
                    ing.isScalable && ing.baseAmount
                      ? `${(ing.baseAmount * scaleRatio).toFixed(ing.unit === 'g' ? 0 : 1)} ${ing.unit}`
                      : ing.fallbackDisplay || `${ing.baseAmount} ${ing.unit}`;
                  return (
                    <li key={ing.id} className="pt-2 flex justify-between items-center text-slate-800">
                      <span className="font-medium">{ing.name}</span>
                      <span className="font-semibold text-emerald-700">{displayAmount}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Steps Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
                <ChefHat className="w-4 h-4 text-emerald-700" />
                <span>Yapılış Adımları ({steps.length} Aşama)</span>
              </div>
              <div className="space-y-3">
                {steps.map((st) => (
                  <div key={st.stepNumber} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900 mb-1">
                      {st.stepNumber}. {st.title}
                    </div>
                    <p className="text-slate-600 leading-relaxed">{st.instruction}</p>
                    {st.tip && (
                      <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60 flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{st.tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Form View */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* Section 1: Temel Bilgiler */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-100">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Temel Tarif Bilgileri ve Bağlı Yemek
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tarif Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Örn: Geleneksel İslahiye Tavası Tarifi"
                  className={`w-full h-10 px-3.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.title
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bağlı Olduğu Yöresel Yemek <span className="text-rose-500">*</span>
                </label>
                <select
                  id="field-dishId"
                  value={dishId}
                  onChange={(e) => handleDishChange(e.target.value)}
                  className={`w-full h-10 px-3.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    errors.dishId
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                >
                  <option value="">-- Yeni Bağımsız Tarif (Otomatik Yemek Oluştur) --</option>
                  {availableDishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} ({dish.categoryLabel})
                    </option>
                  ))}
                </select>
                {errors.dishId && <p className="text-[11px] text-rose-500 mt-1">{errors.dishId}</p>}
              </div>
            </div>

            {(!dishId || dishId.startsWith('dish-')) && (
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 sm:w-72">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tarif Kategorisi (Bağımsız Tarif İçin)
                  </label>
                  <QuickCategoryButton
                    scope="dish"
                    onCreated={(cat) => {
                      setDishCategory(cat.id as Exclude<DishCategory, 'all'>);
                      setIsDirty(true);
                    }}
                  />
                </div>
                <select
                  value={dishCategory}
                  onChange={(e) => {
                    setDishCategory(e.target.value as Exclude<DishCategory, 'all'>);
                    setIsDirty(true);
                  }}
                  className="w-full sm:w-72 h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                >
                  {mergeCategoryOption(
                    getCategories('dish', true),
                    dishCategory,
                    'dish',
                    getCategoryLabel('dish', dishCategory)
                  ).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kısa Vurgu / Alt Başlık
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Örn: Meşe odunu közünde pişen kuzu eti, sarımsak ve İslahiye biberi."
                className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Temel Porsiyon (Hesaplama Paydası)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={baseServings}
                  onChange={(e) => {
                    setBaseServings(Number(e.target.value) || 4);
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hazırlık Süresi
                </label>
                <input
                  type="text"
                  value={prepTime}
                  onChange={(e) => {
                    setPrepTime(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="20 dk"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pişirme Süresi
                </label>
                <input
                  type="text"
                  value={cookTime}
                  onChange={(e) => {
                    setCookTime(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="45 dk"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tarif Kapak Görseli */}
          <div id="field-imageUrl" className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <ImageUploadField
              value={imageUrl}
              onChange={(url) => {
                setImageUrl(url);
                setIsDirty(true);
              }}
              altText={imageCaption}
              onAltTextChange={(caption) => {
                setImageCaption(caption);
                setIsDirty(true);
              }}
              label="Tarif ve Pişirme Görseli"
              required
            />
          </div>

          {/* Section 3: Malzemeler */}
          <div id="field-ingredients" className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-100">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Malzeme Listesi ve Ölçeklendirme
                </h3>
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200/60 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Malzeme Ekle</span>
              </button>
            </div>

            {errors.ingredients && (
              <p className="text-xs text-rose-500 font-semibold">{errors.ingredients}</p>
            )}

            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div
                  key={ing.id}
                  className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3"
                >
                  <span className="text-xs font-sans font-bold text-slate-500 w-6 text-center">
                    {idx + 1}
                  </span>

                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                      placeholder="Malzeme adı (Örn: Kuzu kuşbaşı)"
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="any"
                      value={ing.baseAmount}
                      onChange={(e) => updateIngredient(ing.id, 'baseAmount', Number(e.target.value) || 0)}
                      placeholder="Miktar"
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="text"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                      placeholder="Birim (g, adet...)"
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ing.isScalable}
                      onChange={(e) => updateIngredient(ing.id, 'isScalable', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Ölçeklenir</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Malzemeyi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Adımlar */}
          <div id="field-steps" className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-100">
                  3
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Hazırlık ve Pişirme Adımları
                </h3>
              </div>
              <button
                type="button"
                onClick={addStep}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200/60 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adım Ekle</span>
              </button>
            </div>

            {errors.steps && (
              <p className="text-xs text-rose-500 font-semibold">{errors.steps}</p>
            )}

            <div className="space-y-4">
              {steps.map((st, idx) => (
                <div
                  key={st.stepNumber}
                  className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Adım {st.stepNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(st.stepNumber)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded ml-2"
                        title="Adımı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => updateStep(st.stepNumber, 'title', e.target.value)}
                    placeholder="Adım Başlığı (Örn: Taş Fırında Pişirme)"
                    className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />

                  <textarea
                    rows={2}
                    value={st.instruction}
                    onChange={(e) => updateStep(st.stepNumber, 'instruction', e.target.value)}
                    placeholder="Detaylı talimat metni..."
                    className="w-full p-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />

                  <input
                    type="text"
                    value={st.tip || ''}
                    onChange={(e) => updateStep(st.stepNumber, 'tip', e.target.value)}
                    placeholder="İpucu / Usta Notu (Opsiyonel)"
                    className="w-full h-8 px-3 text-xs border border-amber-200 rounded-lg bg-amber-50/50 text-amber-900 placeholder:text-amber-600/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Yayın Durumu */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-100">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Yayın ve Atölye Durumu
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Yayın Durumu
                </label>
                <select
                  value={publicationStatus}
                  disabled={!canSave}
                  onChange={(e) => {
                    setPublicationStatus(e.target.value as PublicationStatus);
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white disabled:bg-slate-50"
                >
                  <option value="published" disabled={!canPublish}>
                    Yayında (Tarif Atölyesinde aktif){!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                  </option>
                  <option value="draft">Taslak (Yalnızca yönetimde görünür)</option>
                  <option value="in_review">İncelemede (Onay bekliyor)</option>
                  <option value="archived" disabled={!canPublish}>
                    Arşivde (Portalda gizli){!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Zorluk Seviyesi
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as 'Kolay' | 'Orta' | 'Ustalık Gerektirir');
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                >
                  <option value="Kolay">Kolay</option>
                  <option value="Orta">Orta</option>
                  <option value="Ustalık Gerektirir">Ustalık Gerektirir</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Bottom Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg mr-auto animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{Object.keys(errors).length} zorunlu alanda eksik veya hatalı bilgi var</span>
              </div>
            )}

            <Link
              to="/yonetim/tarifler"
              className="h-10 px-4 inline-flex items-center text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Vazgeç
            </Link>

            {canSave && publicationStatus !== 'draft' && (
              <button
                type="button"
                onClick={() => handleSave('draft')}
                className="h-10 px-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Save className="w-4 h-4 text-slate-400" />
                <span>Taslak Sakla</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canSave}
              onClick={() => handleSave()}
              title={!canSave ? 'Aktif rolünüzle kayıt kaydedemezsiniz' : undefined}
              className="h-10 px-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-2xs disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>{primaryButtonLabel}</span>
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Tarifi Sil"
        message={`"${title}" kaydını envanterden silmek istediğinize emin misiniz?`}
        confirmText="Evet, Kalıcı Olarak Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
