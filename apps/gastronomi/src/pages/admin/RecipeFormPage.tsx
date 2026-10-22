import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Globe,
  Trash2,
  AlertCircle,
  CheckCircle2,
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
import { Recipe, ScalableIngredient, RecipeStep, PublicationStatus } from '../../types';

export const RecipeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecipeById, getDishes, saveRecipe, deleteRecipe } = useContent();

  const isEditing = Boolean(id);
  const existingRecipe = useMemo(() => (id ? getRecipeById(id) : undefined), [id, getRecipeById]);
  const availableDishes = getDishes();

  // Recipe Main Fields
  const [dishId, setDishId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [baseServings, setBaseServings] = useState<number>(4);
  const [prepTime, setPrepTime] = useState('20 dk');
  const [cookTime, setCookTime] = useState('45 dk');
  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Ustalık Gerektirir'>('Orta');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('/images/islahiye_tava.jpg');
  const [imageCaption, setImageCaption] = useState('');
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>('draft');

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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Populate if editing
  useEffect(() => {
    if (existingRecipe) {
      setDishId(existingRecipe.dishId);
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
    } else if (availableDishes.length > 0 && !dishId) {
      setDishId(availableDishes[0].id);
      setImageUrl(availableDishes[0].imageUrl);
    }
  }, [existingRecipe, availableDishes]);

  // When linked dish changes, update default image if not manually changed
  const handleDishChange = (selectedDishId: string) => {
    setDishId(selectedDishId);
    setIsDirty(true);
    const dish = availableDishes.find((d) => d.id === selectedDishId);
    if (dish && (!title || title === 'Yeni Tarif')) {
      setTitle(`${dish.name} Tarifi`);
      setImageUrl(dish.imageUrl);
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
        baseAmount: 100,
        unit: 'g',
        fallbackDisplay: '100 g',
        isScalable: true,
      },
    ]);
    setIsDirty(true);
  };

  const updateIngredient = (index: number, updates: Partial<ScalableIngredient>) => {
    const next = [...ingredients];
    const item = { ...next[index], ...updates };

    // Auto calculate fallbackDisplay if baseAmount & unit changed
    if ('baseAmount' in updates || 'unit' in updates) {
      if (item.baseAmount && item.baseAmount > 0) {
        item.fallbackDisplay = `${item.baseAmount} ${item.unit || ''}`.trim();
        item.isScalable = true;
      }
    }

    next[index] = item;
    setIngredients(next);
    setIsDirty(true);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const moveIngredient = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= ingredients.length) return;
    const next = [...ingredients];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setIngredients(next);
    setIsDirty(true);
  };

  // Step Helpers
  const addStep = () => {
    const newStepNum = steps.length + 1;
    setSteps([
      ...steps,
      {
        stepNumber: newStepNum,
        title: `${newStepNum}. Aşama`,
        instruction: '',
        tip: '',
      },
    ]);
    setIsDirty(true);
  };

  const updateStep = (index: number, updates: Partial<RecipeStep>) => {
    const next = [...steps];
    next[index] = { ...next[index], ...updates };
    setSteps(next);
    setIsDirty(true);
  };

  const removeStep = (index: number) => {
    const next = steps.filter((_, i) => i !== index).map((s, idx) => ({
      ...s,
      stepNumber: idx + 1,
    }));
    setSteps(next);
    setIsDirty(true);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    // Re-index step numbers
    const reindexed = next.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(reindexed);
    setIsDirty(true);
  };

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3) {
      newErrors.title = 'Tarif başlığı en az 3 karakter olmalıdır.';
    }
    if (!dishId) {
      newErrors.dishId = 'İlişkili bir yemek seçilmelidir.';
    }
    if (ingredients.length < 2) {
      newErrors.ingredients = 'Tarifte en az 2 malzeme tanımlanmalıdır.';
    }
    if (steps.length < 1) {
      newErrors.steps = 'Tarifte en az 1 yapılış adımı bulunmalıdır.';
    }
    const emptyIngredients = ingredients.some((i) => !i.name.trim());
    if (emptyIngredients) {
      newErrors.ingredients = 'Tüm malzemelerin isimleri doldurulmalıdır.';
    }
    const emptySteps = steps.some((s) => !s.instruction.trim());
    if (emptySteps) {
      newErrors.steps = 'Tüm adımların talimat metinleri doldurulmalıdır.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!validate()) {
      setActiveTab('form');
      setNotification({ type: 'error', message: 'Lütfen tarifteki zorunlu alanları kontrol edin.' });
      return;
    }

    const finalStatus = targetStatus || publicationStatus;
    const recipeId = isEditing && existingRecipe ? existingRecipe.id : `recipe-${dishId || Date.now()}`;

    const updatedRecipe: Recipe = {
      id: recipeId,
      dishId,
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

    saveRecipe(updatedRecipe);
    setIsDirty(false);
    setPublicationStatus(finalStatus);
    setNotification({
      type: 'success',
      message:
        finalStatus === 'published'
          ? 'Tarif başarıyla kaydedildi! Tarif Atölyesi ve önizleme pencerelerinde güncellendi.'
          : 'Tarif taslak olarak kaydedildi.',
    });

    setTimeout(() => {
      navigate('/yonetim/tarifler');
    }, 1200);
  };

  const handleDelete = () => {
    if (existingRecipe) {
      deleteRecipe(existingRecipe.id);
      setShowDeleteModal(false);
      navigate('/yonetim/tarifler');
    }
  };

  // Portion Scaling calculation for preview
  const scaleRatio = previewServings / (baseServings || 4);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/tarifler"
            className="p-2 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tarif Listesine Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200">
                {isEditing ? 'Tarif Düzenle' : 'Yeni Tarif Ekle'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-xs font-semibold ${
                  publicationStatus === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : publicationStatus === 'archived'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {publicationStatus === 'published'
                  ? 'Yayında'
                  : publicationStatus === 'archived'
                  ? 'Arşivde'
                  : 'Taslak'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {title || (isEditing ? 'Tarif Düzenleme' : 'Yeni Mutfak Tarifi')}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{activeTab === 'form' ? 'Atölye Önizlemesi' : 'Forma Dön'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>Taslak Kaydet</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Demo Olarak Yayımla</span>
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-sm text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
              title="Tarifi Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-sm border flex items-center justify-between text-xs animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Tarifte kaydedilmemiş düzenlemeleriniz bulunmaktadır.</span>
        </div>
      )}

      {/* Main Tab Switch */}
      {activeTab === 'preview' ? (
        /* Recipe Workshop Live Simulator */
        <div className="bg-white p-6 sm:p-8 rounded-sm border border-slate-200 shadow-xs space-y-8">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
                TARİF ATÖLYESİ CANLI SİMÜLASYONU & PORSİYON TESTİ
              </span>
              <h2 className="text-2xl font-display font-bold text-forest mt-1">
                {title || 'Tarif Başlığı'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
            </div>

            {/* Interactive Servings Scaler */}
            <div className="flex items-center gap-2 bg-sand/30 p-2 rounded-sm border border-sand">
              <span className="text-xs font-semibold text-charcoal">Test Porsiyonu:</span>
              {[2, 4, 6, 8].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreviewServings(s)}
                  className={`w-7 h-7 rounded-xs text-xs font-bold font-mono transition-colors ${
                    previewServings === s
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-sand hover:bg-sand/40'
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
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase font-mono border-b pb-2">
                <Utensils className="w-4 h-4 text-copper" />
                <span>Malzemeler ({previewServings} Kişilik Hesaplama)</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-sm overflow-hidden bg-slate-50/50">
                {ingredients.map((ing) => {
                  let displayAmount = ing.fallbackDisplay;
                  if (ing.isScalable && ing.baseAmount) {
                    const scaled = Math.round(ing.baseAmount * scaleRatio);
                    displayAmount = `${scaled} ${ing.unit || ''}`.trim();
                  }

                  return (
                    <div
                      key={ing.id}
                      className="p-3 flex items-center justify-between text-xs font-sans hover:bg-white transition-colors"
                    >
                      <span className="font-medium text-slate-800">{ing.name || 'İsimsiz Malzeme'}</span>
                      <span className="font-mono font-bold text-copper px-2 py-0.5 rounded-xs bg-copper/10">
                        {displayAmount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Steps Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase font-mono border-b pb-2">
                <ChefHat className="w-4 h-4 text-copper" />
                <span>Hazırlık ve Pişirme Adımları</span>
              </div>

              <div className="space-y-3">
                {steps.map((st) => (
                  <div
                    key={st.stepNumber}
                    className="p-4 rounded-sm border border-slate-200 bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {st.stepNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 font-sans">
                        {st.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans pl-7">
                      {st.instruction}
                    </p>
                    {st.tip && (
                      <div className="ml-7 p-2 bg-amber-50 rounded-xs border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span><strong>Usta İpucu:</strong> {st.tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Recipe Form */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* Section 1: Tarif Başlığı ve İlişkili Yemek */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              1. Tarif Kimliği & İlişkili Lezzet
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İlişkili Yemek Seçimi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={dishId}
                  onChange={(e) => handleDishChange(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-sm focus:outline-none focus:ring-1 bg-white ${
                    errors.dishId ? 'border-rose-400' : 'border-slate-300 focus:ring-forest focus:border-forest'
                  }`}
                >
                  <option value="">-- Bir Yemek Seçin --</option>
                  {availableDishes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.categoryLabel})
                    </option>
                  ))}
                </select>
                {errors.dishId && <p className="text-[11px] text-rose-500 mt-1">{errors.dishId}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tarif Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Örn: Geleneksel İslahiye Tavası Tarifi"
                  className={`w-full px-3 py-2 text-xs border rounded-sm focus:outline-none focus:ring-1 ${
                    errors.title ? 'border-rose-400' : 'border-slate-300 focus:ring-forest focus:border-forest'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temel Porsiyon (Ölçek Bazı)
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hazırlık Süresi
                </label>
                <input
                  type="text"
                  value={prepTime}
                  onChange={(e) => {
                    setPrepTime(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="25 dk"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pişirme Süresi
                </label>
                <input
                  type="text"
                  value={cookTime}
                  onChange={(e) => {
                    setCookTime(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="55 dk"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zorluk
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as 'Kolay' | 'Orta' | 'Ustalık Gerektirir');
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest bg-white"
                >
                  <option value="Kolay">Kolay</option>
                  <option value="Orta">Orta</option>
                  <option value="Ustalık Gerektirir">Ustalık Gerektirir</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usta Pişirme Notları / Ocaklık Tüyoları
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Örn: Taş fırında piştiğinde lezzeti katlanır; ev fırınında 200°C alt-üst ayarda pişirilebilir..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
              />
            </div>
          </div>

          {/* Section 2: Malzemeler (Ölçeklenebilir) */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold">
                  2. Malzeme Listesi ({ingredients.length} Kalem)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Sayısal miktar girilen malzemeler porsiyon değiştirildiğinde otomatik ölçeklenir.
                </p>
              </div>

              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-forest text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Malzeme Ekle</span>
              </button>
            </div>

            {errors.ingredients && (
              <p className="text-xs text-rose-500 font-medium">{errors.ingredients}</p>
            )}

            <div className="space-y-2.5">
              {ingredients.map((ing, idx) => (
                <div
                  key={ing.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveIngredient(idx, 'up')}
                      className="p-1 hover:text-slate-700 disabled:opacity-30"
                      title="Yukarı Taşı"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === ingredients.length - 1}
                      onClick={() => moveIngredient(idx, 'down')}
                      className="p-1 hover:text-slate-700 disabled:opacity-30"
                      title="Aşağı Taşı"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                        placeholder="Malzeme Adı (Örn: Kuzu kuşbaşı)"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        value={ing.baseAmount ?? ''}
                        onChange={(e) =>
                          updateIngredient(idx, {
                            baseAmount: e.target.value === '' ? undefined : Number(e.target.value),
                            isScalable: e.target.value !== '',
                          })
                        }
                        placeholder="Miktar (Örn: 800)"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm font-mono focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={ing.unit ?? ''}
                        onChange={(e) => updateIngredient(idx, { unit: e.target.value })}
                        placeholder="Birim (g, diş...)"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={ing.fallbackDisplay}
                        onChange={(e) => updateIngredient(idx, { fallbackDisplay: e.target.value })}
                        placeholder="Görünüm metni"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xs transition-colors shrink-0"
                    title="Malzemeyi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Yapılış Adımları */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold">
                  3. Yapılış Adımları ({steps.length} Aşama)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Adımlar Tarif Atölyesi'nde adım adım kullanıcıya rehberlik eder.
                </p>
              </div>

              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-forest text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adım Ekle</span>
              </button>
            </div>

            {errors.steps && (
              <p className="text-xs text-rose-500 font-medium">{errors.steps}</p>
            )}

            <div className="space-y-4">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3 relative"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-forest text-white text-xs font-mono font-bold flex items-center justify-center">
                        {st.stepNumber}
                      </span>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => updateStep(idx, { title: e.target.value })}
                        placeholder="Adım Başlığı (Örn: Sarımsak ve Sebzelerin Dizilmesi)"
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-sm w-64 focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveStep(idx, 'up')}
                        className="p-1 hover:text-slate-700 disabled:opacity-30"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === steps.length - 1}
                        onClick={() => moveStep(idx, 'down')}
                        className="p-1 hover:text-slate-700 disabled:opacity-30"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700 ml-2"
                        title="Adımı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Adım Talimatı <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={st.instruction}
                      onChange={(e) => updateStep(idx, { instruction: e.target.value })}
                      placeholder="Bu adımda ne yapılması gerektiğini detaylıca anlatın..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Usta İpucu (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={st.tip || ''}
                      onChange={(e) => updateStep(idx, { tip: e.target.value })}
                      placeholder="Örn: Sarımsakları ezmeden bütün koymak lezzeti korur..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Yayın Durumu */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              4. Yayın ve Görünürlük
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yayın Durumu
                </label>
                <select
                  value={publicationStatus}
                  onChange={(e) => {
                    setPublicationStatus(e.target.value as PublicationStatus);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="draft">Taslak (Yalnızca CMS'te görünür)</option>
                  <option value="in_review">İncelemede (Onay bekliyor)</option>
                  <option value="published">Yayında (Atölye ve Önizlemede aktif)</option>
                  <option value="archived">Arşivde (Portalda gizli)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Görsel URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to="/yonetim/tarifler"
              className="px-4 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Vazgeç
            </Link>

            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="px-4 py-2 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
            >
              Taslak Kaydet
            </button>

            <button
              type="button"
              onClick={() => handleSave('published')}
              className="px-6 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Kaydet ve Yayımla
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Tarifi Silmek İstiyor musunuz?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{title}"</strong> tarifi silinecek ve Tarif Atölyesi'nden kaldırılacaktır. Başlangıç verileri dilediğiniz zaman CMS ayarlarından sıfırlanabilir.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-sm bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
