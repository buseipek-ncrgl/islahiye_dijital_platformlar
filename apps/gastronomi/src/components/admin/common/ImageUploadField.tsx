import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, FolderOpen } from 'lucide-react';
import { ImageWithFallback } from '../../ui/ImageWithFallback';

export interface PresetImageOption {
  label: string;
  url: string;
  category?: string;
}

export const CURATED_PRESET_IMAGES: PresetImageOption[] = [
  { label: 'Geleneksel İslahiye Tavası', url: '/images/islahiye_tava.jpg', category: 'Ana Yemek' },
  { label: 'Amanos Usulü Firik Pilavı', url: '/images/firik_pilavi.jpg', category: 'Ana Yemek' },
  { label: 'Amanos Keme Kebabı', url: '/images/dishes/keme_kebabi.jpg', category: 'Kebap' },
  { label: 'İslahiye Usulü Simit Kebabı', url: '/images/dishes/simit_kebabi.jpg', category: 'Kebap' },
  { label: 'Taş Fırın Küşleme', url: '/images/dishes/kusleme.jpg', category: 'Kebap' },
  { label: 'Köz Domatesli Altı Ezmeli Kebap', url: '/images/dishes/alti_ezmeli_kebap.jpg', category: 'Kebap' },
  { label: 'Geleneksel Alaca Çorbası', url: '/images/dishes/alaca_corbasi.jpg', category: 'Çorba' },
  { label: 'Bahar Şiveydizi', url: '/images/dishes/siveydiz.jpg', category: 'Çorba / Tencere' },
  { label: 'Nohutlu Lebeniye / Yuvalama', url: '/images/dishes/lebeniye_corbasi.jpg', category: 'Çorba' },
  { label: 'Meşe Ateşinde Tandır Çorbası', url: '/images/tandir_corbasi.jpg', category: 'Çorba' },
  { label: 'Tandırda İslahiye Biberli Ekmeği', url: '/images/dishes/biberli_ekmek.jpg', category: 'Hamur İşi' },
  { label: 'Fırınlanmış Kaytaz Böreği', url: '/images/dishes/kaytaz_boregi.jpg', category: 'Hamur İşi' },
  { label: 'Fırında Amanos Oruğu (İçli Köfte)', url: '/images/dishes/oruk_icli_kofte.jpg', category: 'Hamur İşi' },
  { label: 'Geleneksel İslahiye Semseği', url: '/images/semsek_boregi.jpg', category: 'Hamur İşi' },
  { label: 'Taş Fırın Bayram Kömbesi', url: '/images/islahiye_kombesi.jpg', category: 'Çörek' },
  { label: 'Taş Fırın Antep Katmeri', url: '/images/dishes/katmer.jpg', category: 'Tatlı' },
  { label: 'Cevizli Taş Kadayıf', url: '/images/dishes/tas_kadayif.jpg', category: 'Tatlı' },
  { label: 'Safranlı Bayram Zerdesi', url: '/images/dishes/zerde.jpg', category: 'Tatlı' },
  { label: 'Cevizli Dağ İnciri Tatlısı', url: '/images/incir_tatlisi.jpg', category: 'Tatlı' },
  { label: 'Tescilli İslahiye Biberi', url: '/images/islahiye_biberi.jpg', category: 'Tescilli Ürün' },
  { label: 'Közlenmiş İslahiye Biber Mezesi', url: '/images/biber_kozleme_poster.jpg', category: 'Tescilli Ürün' },
  { label: 'Taş Fırın Közü & Ocaklık', url: '/images/tas_firin_kozu_poster.jpg', category: 'Mutfak Ortamı' },
  { label: 'Amanos Dağları Manzarası', url: '/images/amanos_daglari.jpg', category: 'Coğrafya' },
];

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
  credit?: string;
  onCreditChange?: (credit: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  presetImages?: PresetImageOption[];
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  altText,
  onAltTextChange,
  credit,
  onCreditChange,
  label = 'İçerik Görseli',
  error,
  required = false,
  presetImages = CURATED_PRESET_IMAGES,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file selection and convert to Base64 Data URL
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFileError('Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP).');
      return;
    }

    setFileError('');

    // Format file size
    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${sizeInKb} KB`;

    setFileName(file.name);
    setFileSize(sizeStr);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
        if (onAltTextChange && !altText) {
          // Auto-suggest alt text from file name without extension
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          onAltTextChange(cleanName);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const isDataUrl = value?.startsWith('data:image/');

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        
        {/* Input Mode Selector Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setFileError('');
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bilgisayardan Yükle</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab('preset');
              setFileError('');
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Hazır Arşiv ({presetImages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setFileError('');
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>URL / Yol Gir</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload/Picker on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Selected Input Mode */}
        <div className="md:col-span-7 space-y-3">
          {/* TAB 1: LOCAL FILE UPLOAD & DRAG DROP */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                    : isDataUrl
                    ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-2 shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>

                <div className="text-xs font-bold text-slate-800 mb-0.5">
                  Fotoğrafı Buraya Sürükleyin veya Dosya Seçin
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-2">
                  JPG, PNG veya WebP formatında kendi bilgisayarınızdaki yemek fotoğrafını yükleyebilirsiniz.
                </p>

                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition pointer-events-none inline-flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Bilgisayardan Gözat</span>
                </button>

                {isDataUrl && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-center gap-2 text-xs text-emerald-800 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Seçilen dosya tarayıcıya yüklendi {fileName ? `(${fileName}${fileSize ? ` • ${fileSize}` : ''})` : ''}</span>
                  </div>
                )}
              </div>

              {fileError && (
                <p role="alert" className="mt-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {fileError}
                </p>
              )}
            </div>
          )}

          {/* TAB 2: PRESET ARCHIVE PICKER */}
          {activeTab === 'preset' && (
            <div className="space-y-2">
              <span className="text-[11px] text-slate-500 block font-medium">
                Saha ve atölye kayıtlı hazır profesyonel yemek fotoğraflarından birine tıklayarak seçin:
              </span>

              <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presetImages.map((preset) => {
                    const isSelected = value === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          onChange(preset.url);
                          if (onAltTextChange && !altText) onAltTextChange(preset.label);
                        }}
                        className={`group relative rounded-lg border overflow-hidden p-1.5 text-left transition text-xs cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40'
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="w-full aspect-[16/10] rounded-md overflow-hidden bg-slate-100 mb-1.5">
                          <ImageWithFallback
                            src={preset.url}
                            alt={preset.label}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="min-w-0">
                          <span className={`block font-bold truncate text-[11px] ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {preset.label}
                          </span>
                          {preset.category && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              {preset.category}
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM URL / PATH */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-500 font-medium">
                Web Görsel Bağlantısı (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">https://...</code>) veya Yerel Dosya Yolu (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">/images/dishes/...</code>):
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="/images/dishes/oruk_icli_kofte.jpg veya https://..."
                  className="w-full h-10 pl-3.5 pr-9 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                />
                {value && (
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title="Temizle"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                İpucu: Harici CDN fotoğrafları (Unsplash vb.) veya projenin <code className="text-slate-600 font-mono">public/images/</code> klasöründeki dosyaları doğrudan yazabilirsiniz.
              </p>
            </div>
          )}

          {/* Metadata: Alt Metni & Telif Bilgisi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {onAltTextChange && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Erişilebilirlik Alt Metni (Alt Text)
                </label>
                <input
                  type="text"
                  value={altText || ''}
                  onChange={(e) => onAltTextChange(e.target.value)}
                  placeholder="Yemeğin görsel tanımı..."
                  className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}

            {onCreditChange && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Fotoğraf Telif / Kaynak Atfı
                </label>
                <input
                  type="text"
                  value={credit || ''}
                  onChange={(e) => onCreditChange(e.target.value)}
                  placeholder="İslahiye Lezzet Atlası Görsel Arşivi"
                  className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}
          </div>

          {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
        </div>

        {/* Right Column (5 cols): Live Visual Preview Card */}
        <div className="md:col-span-5">
          <div className="h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Canlı Önizleme</span>
                </span>

                {value ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    {isDataUrl ? 'Özel Dosya Yüklendi' : 'URL / Arşiv Bağlı'}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    Görsel Seçilmedi
                  </span>
                )}
              </div>

              <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs">
                {value ? (
                  <ImageWithFallback
                    src={value}
                    alt={altText || 'Önizleme'}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 p-4 text-center">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <span className="font-medium text-slate-500">Görsel Seçimi Bekleniyor</span>
                    <span className="text-[10px] text-slate-400">Dosya yükleyebilir, arşivden seçebilir veya link girebilirsiniz.</span>
                  </div>
                )}
              </div>
            </div>

            {value && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[200px]" title={value}>
                  {isDataUrl ? (fileName || 'Yüklenen Dosya') : value}
                </span>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="text-rose-600 hover:text-rose-800 font-semibold hover:underline cursor-pointer"
                >
                  Kaldır
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

