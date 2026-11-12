import React from 'react';
import { Dish } from '../../types';
import { ATLAS_DISH_NODES } from '../../data/atlas';
import { ISLAHIYE_V2_VIEWBOX, ISLAHIYE_V2_SVG_PATH, ISLAHIYE_V2_CENTER, ISLAHIYE_GEO_PROVENANCE } from '../../data/geo/islahiyeGeo';
import { VerifiedPlacesView } from './VerifiedPlacesView';
import { Info } from 'lucide-react';

export type CanvasMode = 'cultural' | 'geojson_boundary' | 'verified_places';

interface CulturalAtlasCanvasProps {
  activeMode?: CanvasMode;
  onSwitchMode?: (mode: CanvasMode) => void;
  onSwitchToCulturalMode?: () => void;
  dishes?: Dish[];
  selectedDishId?: string | null;
  onSelectDish?: (dish: Dish) => void;
  filteredDishIds?: string[];
  nodes?: typeof ATLAS_DISH_NODES;
  hideModeSwitcher?: boolean;
}

export const CulturalAtlasCanvas: React.FC<CulturalAtlasCanvasProps> = ({
  activeMode = 'cultural',
  onSwitchMode,
  onSwitchToCulturalMode,
  dishes = [],
  selectedDishId,
  onSelectDish,
  filteredDishIds,
  nodes = ATLAS_DISH_NODES,
}) => {
  // Map dish nodes to CMS dish objects (applying optional category/filter list)
  const interactiveNodes = React.useMemo(() => {
    return nodes
      .map((node) => {
        if (filteredDishIds && !filteredDishIds.includes(node.dishId)) {
          return null;
        }
        const dish = dishes.find((d) => d.id === node.dishId);
        if (!dish) return null;
        return {
          ...node,
          dish,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [nodes, dishes, filteredDishIds]);

  return (
    <div className="relative w-full bg-[#f6f2e9] overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. ÜST MOD GEÇİŞ ÇUBUĞU (Kültürel Atlas vs Gerçek GeoJSON Sınırı)          */}
      {/* ========================================================================= */}


      {/* ========================================================================= */}
      {/* 2. MOD A: KÜLTÜREL İLLÜSTRATİF ATLAS (Doğal Oran - 1376x768 Tam Sığan Tuval) */}
      {/* ========================================================================= */}
      {activeMode === 'cultural' && (
        <div className="relative w-full">
          {/* Tam Sığan İllüstratif Harita Arka Planı (Kırpılma olmadan 1376x768 doğal en-boy oranı) */}
          <div className="relative w-full aspect-[1376/768] overflow-hidden bg-[#f6f2e9] shadow-[inset_0_0_24px_rgba(186,133,94,0.12)]">
            <img
              src="/images/atlas_illustrated_background.jpg"
              alt="İslahiye Kültürel ve Gastronomi Seyahatname Haritası"
              className="w-full h-full object-cover object-center block"
              loading="eager"
            />

            {/* 6 İnteraktif Lezzet Düğümü (Büyük, Net Dairesel İğneler) */}
            {interactiveNodes.map(({ dish, canvasPosition, accentNote }) => {
              const isSelected = selectedDishId === dish.id;

              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => onSelectDish?.(dish)}
                  aria-pressed={isSelected}
                  aria-label={`${dish.name} lezzetini incele`}
                  style={{
                    left: `${canvasPosition.x}%`,
                    top: `${canvasPosition.y}%`,
                  }}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ba855e] ${
                    isSelected ? 'z-30 scale-110' : 'hover:scale-105 hover:z-25'
                  }`}
                >
                  {/* Büyük Dairesel Yemek Fotoğrafı & Beyaz + Bakır Çerçeve */}
                  <div className="relative">
                    {/* Seçili durumda ışıma / pulse */}
                    {isSelected && (
                      <span className="absolute -inset-2 rounded-full bg-[#ba855e]/35 animate-ping pointer-events-none" />
                    )}

                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-[58px] lg:h-[58px] rounded-full overflow-hidden transition-all duration-300 ${
                        isSelected
                          ? 'ring-4 ring-white border-2 border-[#ba855e] shadow-xl shadow-[#ba855e]/40 ring-offset-2 ring-offset-[#f6f2e9]'
                          : 'ring-3 ring-white border-2 border-[#ba855e]/80 shadow-md group-hover:ring-white group-hover:border-[#ba855e] group-hover:shadow-xl'
                      }`}
                    >
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover select-none"
                        loading="lazy"
                      />
                    </div>

                    {/* Bakır İğne Noktası */}
                    <div
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-xs transition-colors ${
                        isSelected ? 'bg-[#ba855e] scale-125' : 'bg-[#936645]'
                      }`}
                    />
                  </div>

                  {/* Net Okunabilir Beyaz Rozet Etiketi */}
                  <div
                    className={`mt-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-sans font-bold whitespace-nowrap shadow-md transition-all duration-200 border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#203b31] text-[#fbf6ec] border-[#203b31] shadow-lg'
                        : 'bg-[#fffdf8] text-[#203b31] border-[#d8c7b0] group-hover:border-[#ba855e] group-hover:bg-white group-hover:shadow-lg'
                    }`}
                  >
                    <span className={isSelected ? 'text-copper-light text-[9px]' : 'text-[#ba855e] text-[9px]'}>●</span>
                    <span>{dish.name}</span>
                  </div>

                  {/* Vurgu Notu (Hover) */}
                  {accentNote && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none absolute -bottom-7 text-[9px] font-sans font-medium text-[#786a59] bg-[#fffdf8]/95 px-2 py-0.5 rounded-xs border border-[#dccbb3] shadow-xs">
                      {accentNote}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Alt Bilgi Şeridi */}
          <div className="absolute bottom-2.5 left-3 sm:left-4 flex items-center gap-2 text-[10px] text-[#6d6b5f] font-sans pointer-events-none z-10 bg-[#f7f2e7]/90 backdrop-blur-xs px-2.5 py-1 rounded-2xs border border-[#dfd2be]/70">
            <Info className="w-3.5 h-3.5 text-[#936645] shrink-0" />
            <span>Coğrafi havzalardan esinlenen kültürel lezzet atlası. Fiziksel mekânlar için 'Gerçek Sokak Haritası' modunu kullanabilirsiniz.</span>
          </div>
        </div>
      )}


      {activeMode === 'geojson_boundary' && (
        <div className="p-4 sm:p-7 bg-[#f8f2e5] min-h-[500px] relative overflow-hidden">
          {/* Kartografik Seyahatname Pusula Gülü (Yön A Gravür) */}
          <div className="absolute top-5 right-5 sm:top-7 sm:right-7 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none text-[#203b31] opacity-75 z-10" aria-hidden="true">
            <img src="/motifs/motif_compass_rose.svg" alt="" className="w-full h-full" />
          </div>
          <div className="flex justify-between items-start gap-4 mb-3 px-1 sm:px-3">
            <div>
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#936645] uppercase block mb-1">
                WGS84 KADASTRO &amp; İDARİ GEOMETRİ
              </span>
              <h3 className="font-display text-forest text-xl sm:text-2xl font-normal leading-tight">
                İslahiye Doğrulanmış İlçe Sınırı
              </h3>
            </div>
            <span className="text-[11px] text-[#726b5b] leading-tight text-right font-sans">
              325 noktalı WGS84 GeoJSON Poligonu<br />
              <strong className="text-[#203b31] font-semibold">Resmî Coğrafi Taban</strong>
            </span>
          </div>

          <svg
            className="w-full h-auto max-h-[540px] block select-none mx-auto"
            viewBox={ISLAHIYE_V2_VIEWBOX}
            role="img"
            aria-label="Doğrulanmış 325 noktalı WGS84 GeoJSON poligonundan çizilen İslahiye ilçe silueti"
          >
            <defs>
              <linearGradient id="realLand" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#e5e5cf" />
                <stop offset="56%" stopColor="#e9d9b8" />
                <stop offset="100%" stopColor="#d0d1b1" />
              </linearGradient>

              <pattern id="realPaper" patternUnits="userSpaceOnUse" width="29" height="29">
                <path d="M0 28 H29" fill="none" stroke="#b5aa86" strokeOpacity="0.14" strokeWidth="0.6" />
              </pattern>

              <pattern id="realEngrave" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(31)">
                <path d="M0 0 V14" fill="none" stroke="#4d6251" strokeOpacity="0.085" strokeWidth="1" />
              </pattern>

              <clipPath id="realDistrictClip">
                <path d={ISLAHIYE_V2_SVG_PATH} />
              </clipPath>

              <filter id="realShadow" x="-5%" y="-5%" width="115%" height="115%">
                <feDropShadow dx="2" dy="8" stdDeviation="8" floodColor="#173d30" floodOpacity="0.19" />
              </filter>
            </defs>

            {/* Gerçek İlçe Poligonu */}
            <g filter="url(#realShadow)">
              <path
                d={ISLAHIYE_V2_SVG_PATH}
                fill="url(#realLand)"
                stroke="#183d32"
                strokeWidth="3.1"
                strokeLinejoin="round"
              />
            </g>

            {/* İç Doku Maskesi */}
            <g clipPath="url(#realDistrictClip)">
              <rect x="0" y="0" width="790" height="590" fill="url(#realPaper)" />
              <rect x="0" y="0" width="790" height="590" fill="url(#realEngrave)" />
            </g>

            {/* İlçe Merkezi Anchor Noktası */}
            <g className="map-center">
              <circle cx={ISLAHIYE_V2_CENTER.cx} cy={ISLAHIYE_V2_CENTER.cy} r="12" fill="#fbf5e8" stroke="#9b6747" strokeWidth="2" />
              <circle cx={ISLAHIYE_V2_CENTER.cx} cy={ISLAHIYE_V2_CENTER.cy} r="4" fill="#9b6747" />
              <path d={`M ${ISLAHIYE_V2_CENTER.cx + 14} ${ISLAHIYE_V2_CENTER.cy} h 45`} stroke="#9b6747" strokeWidth="1.2" />
              <rect x={ISLAHIYE_V2_CENTER.cx + 55} y={ISLAHIYE_V2_CENTER.cy - 19} width="155" height="34" rx="1" fill="#fffbf1" stroke="#cab99e" />
              <text x={ISLAHIYE_V2_CENTER.cx + 66} y={ISLAHIYE_V2_CENTER.cy - 5} className="font-display font-medium text-[16px] fill-[#234537]">
                {ISLAHIYE_V2_CENTER.label}
              </text>
              <text x={ISLAHIYE_V2_CENTER.cx + 66} y={ISLAHIYE_V2_CENTER.cy + 8} className="font-sans text-[10px] fill-[#7a715f]">
                {ISLAHIYE_V2_CENTER.sublabel}
              </text>
            </g>

            {/* Koordinat Bilgisi */}
            <text x="31" y="549" className="font-sans text-[11px] fill-[#8d806e]">
              {ISLAHIYE_GEO_PROVENANCE.verifiedBBox.minLon.toFixed(2)}–{ISLAHIYE_GEO_PROVENANCE.verifiedBBox.maxLon.toFixed(2)}° D / {ISLAHIYE_GEO_PROVENANCE.verifiedBBox.minLat.toFixed(2)}–{ISLAHIYE_GEO_PROVENANCE.verifiedBBox.maxLat.toFixed(2)}° K
            </text>
          </svg>

          <div className="border-t border-[#ddcfbb] flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between pt-4 mt-2 px-1 sm:px-3 text-xs font-sans">
            <span className="text-[11px] leading-relaxed text-[#726d61] max-w-lg">
              <strong className="text-[#2b4738] font-semibold">Sınır verisi:</strong> {ISLAHIYE_GEO_PROVENANCE.vertexCount} noktalı WGS84 GeoJSON poligonu. © OpenStreetMap contributors.
            </span>
            <button
              type="button"
              onClick={() => onSwitchMode?.('cultural')}
              className="px-3 py-1.5 bg-[#203b31] text-white text-xs font-semibold rounded-xs hover:bg-[#183027] transition-colors"
            >
              ← Kültürel Seyahatname Haritasına Dön
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MOD C: DOĞRULANMIŞ ZİYARET NOKTALARI (Dürüst Boş Durum)                 */}
      {/* ========================================================================= */}
      {activeMode === 'verified_places' && (
        <VerifiedPlacesView
          onSwitchToCulturalMode={() => {
            if (onSwitchMode) onSwitchMode('cultural');
            else if (onSwitchToCulturalMode) onSwitchToCulturalMode();
          }}
        />
      )}
    </div>
  );
};

