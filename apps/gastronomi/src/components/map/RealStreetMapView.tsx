import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Navigation,
  ExternalLink,
  Layers,
  RotateCcw,
  Compass,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  AlertCircle,
  Sparkles,
  Flame,
  Wheat,
  UtensilsCrossed,
  Cookie,
  Coffee,
} from 'lucide-react';
import { GastronomyPlace, Dish } from '../../types';
import { useContent } from '../../hooks/useContent';
import islahiyeDistrictBoundaryGeojson from '../../data/geo/islahiye-district.json';

// --- HARİTA SAĞLAYICISI YAPILANDIRMASI (OSM STANDARDI) ---
export interface MapProviderConfig {
  name: string;
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
}

export const OSM_MAP_PROVIDER: MapProviderConfig = {
  name: 'OpenStreetMap Standard',
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
  minZoom: 11,
};

// İslahiye İlçe Merkezi (Doğrulanmış Başlangıç Odak Koordinatları)
export const ISLAHIYE_TOWN_CENTER: [number, number] = [37.025678, 36.631868];
export const ISLAHIYE_DEFAULT_ZOOM = 14;

// İslahiye İlçe Bounding Box (Kuzeydoğu & Güneybatı)
export const ISLAHIYE_BBOX_BOUNDS: [[number, number], [number, number]] = [
  [36.825573, 36.4434139],
  [37.1517102, 36.964505],
];

// Panning kısıtlaması (Kullanıcının İslahiye dışına kaymasını engeller)
export const ISLAHIYE_MAX_BOUNDS: [[number, number], [number, number]] = [
  [36.75, 36.35],
  [37.22, 37.05],
];

// 6 Özgün Yöresel Lezzet Hızlı Odak Çipleri (Emojisiz, İkon Tabanlı)
const SIGNATURE_DISH_FILTERS = [
  { id: 'all', label: 'Tüm Duraklar' },
  { id: 'islahiye-tava', label: 'İslahiye Tavası' },
  { id: 'firik-pilavi', label: 'Firik Pilavı' },
  { id: 'islahiye-biberi', label: 'İslahiye Biberi' },
  { id: 'semsek-boregi', label: 'Şemsek Böreği' },
  { id: 'islahiye-kombesi', label: 'İslahiye Kömbesi' },
  { id: 'incir-tatlisi', label: 'İncir Tatlısı' },
];

// Lezzet filtre butonları için temiz Lucide ikon eşleştirmesi
const renderDishFilterIcon = (filterId: string, isActive: boolean) => {
  const iconColor = isActive ? 'text-[#e8b98f]' : 'text-[#a16b48]';
  const iconClass = `w-3 h-3 ${iconColor} shrink-0`;

  switch (filterId) {
    case 'all':
      return <MapPin className={iconClass} />;
    case 'islahiye-tava':
      return <Flame className={iconClass} />;
    case 'firik-pilavi':
      return <Wheat className={iconClass} />;
    case 'islahiye-biberi':
      return <Sparkles className={iconClass} />;
    case 'semsek-boregi':
      return <UtensilsCrossed className={iconClass} />;
    case 'islahiye-kombesi':
      return <Cookie className={iconClass} />;
    case 'incir-tatlisi':
      return <Coffee className={iconClass} />;
    default:
      return <MapPin className={iconClass} />;
  }
};

interface RealStreetMapViewProps {
  onSwitchToCulturalMode?: () => void;
  initialSelectedPlaceId?: string | null;
  initialDishId?: string | null;
  onPreviewDish?: (dish: Dish) => void;
  className?: string;
}

export const RealStreetMapView: React.FC<RealStreetMapViewProps> = ({
  initialSelectedPlaceId = null,
  initialDishId = null,
  onPreviewDish,
  className = '',
}) => {
  const { getPlaces, getDishes } = useContent();

  // Yalnızca editoryal olarak doğrulanmış, yayımlanmış ve gerçek koordinatı olan noktalar
  const allPlaces: GastronomyPlace[] = getPlaces(true);
  const allDishes = getDishes(false);

  // UI Durumları
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialSelectedPlaceId);
  const [selectedDishFilter, setSelectedDishFilter] = useState<string>(initialDishId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maskOutside, setMaskOutside] = useState(true); // Varsayılan olarak sadece İslahiye gösterilir, diğer bölgeler maskelenir
  const [tileError, setTileError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Leaflet Referansları
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const maskLayerRef = useRef<L.Polygon | null>(null);
  const boundaryPolylineRef = useRef<L.Polyline | null>(null);

  // Filtrelenmiş Noktalar
  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((place) => {
      // 1. Koordinat kontrolü (Sıfır sahte nokta kuralı)
      if (!place.coordinates || typeof place.coordinates.lat !== 'number' || typeof place.coordinates.lng !== 'number') {
        return false;
      }

      // 2. Lezzet Filtresi (Burada şu yemek var filtresi)
      if (selectedDishFilter !== 'all') {
        const hasDish = place.relatedDishIds?.includes(selectedDishFilter);
        if (!hasDish) return false;
      }

      // 3. Arama sorgusu
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = place.name.toLowerCase().includes(query);
        const matchAddress = place.address.toLowerCase().includes(query);
        const matchCat = (place.categoryLabel || '').toLowerCase().includes(query);
        const matchDesc = (place.description || '').toLowerCase().includes(query);
        const matchDishes = (place.relatedDishIds || []).some((dishId) => {
          const dishObj = allDishes.find((d) => d.id === dishId);
          return dishObj?.name.toLowerCase().includes(query);
        });
        return matchName || matchAddress || matchCat || matchDesc || matchDishes;
      }

      return true;
    });
  }, [allPlaces, selectedDishFilter, searchQuery, allDishes]);

  // Seçili Nokta Nesnesi
  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) return null;
    return allPlaces.find((p) => p.id === selectedPlaceId) || null;
  }, [allPlaces, selectedPlaceId]);

  // Seçili Noktadaki Birincil Yemek Nesnesi
  const selectedPlaceDish = useMemo(() => {
    if (!selectedPlace?.relatedDishIds?.[0]) return null;
    return allDishes.find((d) => d.id === selectedPlace.relatedDishIds![0]) || null;
  }, [selectedPlace, allDishes]);

  // 1. LEAFLET HARİTA BAŞLATMA VE YAŞAMDÖNGÜSÜ YÖNETİMİ
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: ISLAHIYE_TOWN_CENTER,
        zoom: ISLAHIYE_DEFAULT_ZOOM,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: ISLAHIYE_MAX_BOUNDS,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        scrollWheelZoom: true,
        touchZoom: true,
        dragging: true,
      });

      // Standart Leaflet zoom kontrolü sağ altta
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Gerçek OpenStreetMap Tile Katmanı
      const tileLayer = L.tileLayer(OSM_MAP_PROVIDER.tileUrl, {
        attribution: OSM_MAP_PROVIDER.attribution,
        maxZoom: OSM_MAP_PROVIDER.maxZoom,
        minZoom: 11,
      });

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayer.on('load', () => {
        setTileError(false);
      });

      tileLayer.addTo(map);

      // Eğer özel bir başlangıç durağı seçili değilse tüm İslahiye sınırına odaklan
      if (!initialSelectedPlaceId) {
        map.fitBounds(ISLAHIYE_BBOX_BOUNDS, {
          padding: [24, 24],
          maxZoom: 13,
        });
      }

      // İşaretçiler için LayerGroup
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
      setMapLoaded(true);

      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch (err) {
      console.error('Leaflet harita başlatma hatası:', err);
    }
  }, []);

  // 2. SADECE İSLAHİYE GÖSTERİMİ: TERS POLİGON MASKESİ (DİĞER BÖLGELERİ GİZLEME)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (maskLayerRef.current) {
      maskLayerRef.current.remove();
      maskLayerRef.current = null;
    }
    if (boundaryPolylineRef.current) {
      boundaryPolylineRef.current.remove();
      boundaryPolylineRef.current = null;
    }

    if (maskOutside) {
      try {
        const rawCoords = islahiyeDistrictBoundaryGeojson.features[0].geometry.coordinates[0] as [number, number][];
        // Leaflet [latitude, longitude] bekler, GeoJSON [lon, lat] verir
        const islahiyeLatLngs: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon]);

        // Dış dünya halkası
        const worldOuterRing: [number, number][] = [
          [85, -180],
          [85, 180],
          [-85, 180],
          [-85, -180],
        ];

        // İslahiye dışını sıcak editoryal fildişi (#f6f2e9) ile örten maske (evenodd ile İslahiye'yi delik/şeffaf bırakır)
        const maskPolygon = L.polygon([worldOuterRing, islahiyeLatLngs], {
          fillColor: '#f6f2e9',
          fillOpacity: 0.98,
          stroke: false,
          interactive: false,
        });
        maskPolygon.addTo(map);
        maskLayerRef.current = maskPolygon;

        // İslahiye ilçe sınırını vurgulayan şık editoryal bakır kontur
        const boundaryLine = L.polyline(islahiyeLatLngs, {
          color: '#BA855E',
          weight: 2.5,
          dashArray: '6, 5',
          interactive: false,
        });
        boundaryLine.addTo(map);
        boundaryPolylineRef.current = boundaryLine;
      } catch (e) {
        console.warn('İslahiye maske katmanı eklenemedi:', e);
      }
    }
  }, [maskOutside, mapLoaded]);

  // 3. DOĞRULANMIŞ İŞARETÇİLER (ÇAKIŞMAYAN, ŞIK KOMPAKT PİNLER)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    filteredPlaces.forEach((place) => {
      if (!place.coordinates) return;
      const isSelected = place.id === selectedPlaceId;

      // İlgili yemeği bul
      const primaryDish = place.relatedDishIds?.[0]
        ? allDishes.find((d) => d.id === place.relatedDishIds![0])
        : null;

      const dishImage = primaryDish?.imageUrl || '/images/dishes/islahiye-tava.jpg';
      const dishTitle = primaryDish ? primaryDish.name : place.name;

      // Kompakt dairesel pin: Harita üzerinde küçük yuvarlak gerçek yemek fotoğrafı
      const iconHtml = `
        <div class="relative group cursor-pointer -translate-x-1/2 -translate-y-full flex flex-col items-center ${
          isSelected ? 'z-50' : 'z-20 hover:z-40'
        }">
          ${isSelected ? '<span class="absolute -inset-1.5 rounded-full bg-[#BA855E]/40 animate-ping pointer-events-none"></span>' : ''}
          
          <!-- AÇILIR LEZZET ETİKETİ (Sadece Hover veya Seçili Durumda Gösterilir - Çakışmayı Önler) -->
          <div class="transition-all duration-200 pointer-events-none mb-1.5 ${
            isSelected
              ? 'opacity-100 scale-100'
              : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
          }">
            <div class="px-2.5 py-1 rounded-xs text-[10px] font-bold font-sans tracking-wide whitespace-nowrap shadow-lg border flex items-center gap-1.5 ${
              isSelected
                ? 'bg-[#203B31] text-[#FFF9E9] border-[#BA855E] ring-2 ring-[#BA855E]/40'
                : 'bg-[#FFFDF8] text-[#203B31] border-[#BA855E]'
            }">
              <span class="w-1.5 h-1.5 rounded-full bg-[#BA855E]"></span>
              <span class="font-display font-semibold">${dishTitle}</span>
            </div>
          </div>

          <!-- KÜÇÜK YUVARLAK YEMEK RESMİ (36x36px) -->
          <div class="w-9 h-9 rounded-full overflow-hidden transition-all duration-200 border-2 shadow-md bg-[#FFFDF8] ${
            isSelected
              ? 'border-[#BA855E] scale-120 shadow-xl ring-2 ring-[#BA855E]/60'
              : 'border-[#FFFDF8] ring-1.5 ring-[#BA855E]/70 hover:scale-110 hover:ring-[#BA855E]'
          }">
            <img src="${dishImage}" alt="${dishTitle}" class="w-full h-full object-cover block select-none pointer-events-none" />
          </div>
          
          <!-- İĞNE NOKTASI -->
          <div class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#BA855E]' : 'bg-[#936645]'} mt-0.5 shadow-xs"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [38, 48],
        iconAnchor: [19, 48],
      });

      const marker = L.marker([place.coordinates.lat, place.coordinates.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedPlaceId(place.id);
        map.flyTo([place.coordinates!.lat, place.coordinates!.lng], 16, {
          animate: true,
          duration: 0.8,
        });
      });

      marker.addTo(markersLayer);
    });
  }, [filteredPlaces, selectedPlaceId, mapLoaded, allDishes]);

  // Tüm İslahiye ilçe sınırına sığdırma
  const handleFitDistrict = useCallback(() => {
    if (!mapInstanceRef.current) return;
    setSelectedPlaceId(null);
    setSelectedDishFilter('all');
    mapInstanceRef.current.fitBounds(ISLAHIYE_BBOX_BOUNDS, {
      padding: [24, 24],
      maxZoom: 13,
      animate: true,
    });
  }, []);

  // İlçe merkezine odaklanma
  const handleRecenterTownCenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    setSelectedPlaceId(null);
    setSelectedDishFilter('all');
    mapInstanceRef.current.flyTo(ISLAHIYE_TOWN_CENTER, 14, {
      animate: true,
      duration: 0.8,
    });
  }, []);

  // Bir noktayı seçip haritada odaklanma
  const handleSelectPlace = useCallback((place: GastronomyPlace) => {
    setSelectedPlaceId(place.id);
    if (mapInstanceRef.current && place.coordinates) {
      mapInstanceRef.current.flyTo([place.coordinates.lat, place.coordinates.lng], 16, {
        animate: true,
        duration: 0.8,
      });
    }
  }, []);

  // Belirli bir lezzete tıklanıp o lezzetin durağına odaklanma
  const handleDishFilterSelect = useCallback(
    (dishId: string) => {
      setSelectedDishFilter(dishId);
      if (dishId === 'all') {
        setSelectedPlaceId(null);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(ISLAHIYE_TOWN_CENTER, ISLAHIYE_DEFAULT_ZOOM, {
            animate: true,
            duration: 0.8,
          });
        }
        return;
      }

      const matchPlace = allPlaces.find((p) => p.relatedDishIds?.includes(dishId));
      if (matchPlace && matchPlace.coordinates) {
        setSelectedPlaceId(matchPlace.id);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(
            [matchPlace.coordinates.lat, matchPlace.coordinates.lng],
            16,
            { animate: true, duration: 0.8 }
          );
        }
      }
    },
    [allPlaces]
  );

  // Yol Tarifi Al (Gerçek Google Maps Harita Navigasyonu)
  const handleOpenDirections = useCallback((lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className={`relative w-full bg-[#f6f2e9] text-[#242724] font-sans ${className}`}>
      {/* Ağ/Bağlantı Uyarı Çubuğu */}
      {tileError && (
        <div className="bg-[#fff3cd] border-b border-[#ffeeba] px-4 py-2 text-xs text-[#856404] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#856404] shrink-0" />
          <span>
            Harita döşemeleri yüklenirken bir bağlantı gecikmesi yaşanıyor. Lütfen internet bağlantınızı kontrol ediniz.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANA DÜZEN: SOLDA FERAH SOKAK HARİTASI, SAĞDA PANEL                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.9fr)_minmax(350px,0.92fr)] items-stretch">
        {/* SOL: GERÇEK LEAFLET OPENSTREETMAP SAHNESİ */}
        <div className="relative min-w-0 min-h-[480px] sm:min-h-[580px] lg:min-h-[640px] bg-[#f6f2e9] border-b lg:border-b-0 lg:border-r border-[#dccbb3]">
          {/* Leaflet DOM Kapsayıcısı */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

          {/* Harita İçi Sağ Üst Yüzen Sade Kontroller (Tek ve Net) */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#fffdf8]/95 backdrop-blur-xs px-2 py-1.5 rounded-xs border border-[#dccbb3] shadow-xs text-xs font-sans">
            <button
              type="button"
              onClick={handleFitDistrict}
              className="px-2.5 py-1 rounded-2xs font-semibold text-[#555f55] hover:text-[#203b31] hover:bg-[#ede3ca]/50 transition-colors flex items-center gap-1.5"
              title="Tüm İslahiye ilçe sınırını ekrana sığdırır"
            >
              <Compass className="w-3.5 h-3.5 text-[#ba855e]" />
              <span>Tüm İslahiye</span>
            </button>

            <span className="w-px h-3.5 bg-[#dccbb3]" />

            <button
              type="button"
              onClick={handleRecenterTownCenter}
              className="px-2.5 py-1 rounded-2xs font-semibold text-[#555f55] hover:text-[#203b31] hover:bg-[#ede3ca]/50 transition-colors flex items-center gap-1.5"
              title="Lezzet duraklarının yoğunlaştığı ilçe merkezine yaklaşır"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#ba855e]" />
              <span>Çarşı Merkezi</span>
            </button>

            <span className="w-px h-3.5 bg-[#dccbb3]" />

            <button
              type="button"
              onClick={() => setMaskOutside((prev) => !prev)}
              className={`px-2 py-1 rounded-2xs font-semibold transition-colors flex items-center gap-1 text-[11px] ${
                maskOutside
                  ? 'bg-[#203b31] text-[#fff9e9]'
                  : 'text-[#6c695e] hover:text-[#203b31]'
              }`}
              title="Çevre bölgeleri gizleyip sadece İslahiye'yi gösterir"
            >
              <Layers className="w-3 h-3 text-[#ba855e]" />
              <span>{maskOutside ? 'Yalnızca İslahiye' : 'Tüm Çevre'}</span>
            </button>
          </div>

          {/* Sol Alt Koordinat & Bilgi Göstergesi */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none bg-[#fffdf8]/90 backdrop-blur-xs px-2.5 py-1 rounded-2xs border border-[#dccbb3] shadow-xs text-[10px] font-mono text-[#6d6b5f] flex items-center gap-2">
            <span>● Yalnızca İslahiye İlçe Haritası (OpenStreetMap + Sınır Maskesi)</span>
          </div>
        </div>

        {/* SAĞ: ARAMA, LEZZET ODAKLARI & SEÇİLİ YER DETAY PANELİ */}
        <aside
          className="p-4 sm:p-5 lg:p-6 bg-[#fffaf1] flex flex-col justify-between overflow-y-auto max-h-[720px] shadow-xs"
          aria-label="Gastronomi ziyaret noktaları paneli"
        >
          <div>
            {/* 1. Başlık ve Sayaç */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#dfd2c0]">
              <span className="text-[#936645] text-[11px] font-bold tracking-[0.2em] font-mono uppercase">
                GASTRONOMİ DURAKLARI
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-2xs bg-[#ede3ca] text-[#203b31]">
                {filteredPlaces.length} Doğrulanmış Nokta
              </span>
            </div>

            {/* 2. Arama Girişi */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#8d765e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lezzet veya taş fırın ara..."
                className="w-full pl-9 pr-8 py-2 bg-[#fffdf8] border border-[#dccbb3] rounded-xs text-xs font-sans text-[#203b31] placeholder-[#8d765e] focus:outline-none focus:border-[#ba855e]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8d765e] hover:text-[#203b31]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 3. 6 Özgün Lezzet Odak Çipleri (Sidebar İçinde Derli Toplu) */}
            <div className="mb-4 pb-3 border-b border-[#dfd2c0]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#936645] font-bold block mb-2">
                Lezzet Odakları (6 Özgün Tat):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SIGNATURE_DISH_FILTERS.map((item) => {
                  const isActive = selectedDishFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleDishFilterSelect(item.id)}
                      className={`px-2.5 py-1 rounded-2xs text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#203b31] text-[#fff9e9] shadow-xs font-semibold ring-1 ring-[#ba855e]/40'
                          : 'bg-[#fffdf8] text-[#555f55] border border-[#dccbb3] hover:border-[#ba855e] hover:bg-[#faf4e8]'
                      }`}
                    >
                      {renderDishFilterIcon(item.id, isActive)}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. DURUM A: SEÇİLİ YER DETAY KARTI */}
            {selectedPlace ? (
              <div className="bg-[#fffdf8] border border-[#dccbb3] rounded-xs p-4 shadow-xs mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-2xs bg-[#203b31] text-[#fff9e9]">
                    {selectedPlace.categoryLabel || 'Gastronomi Noktası'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPlaceId(null)}
                    className="text-[#8d765e] hover:text-[#203b31] text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Listeye Dön</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* BURADA BULUNAN YÖRESEL LEZZET VURGUSU */}
                {selectedPlaceDish && (
                  <div className="mb-3.5 p-3 bg-[#fbf6ec] border border-[#dccbb3] rounded-xs">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono font-bold text-[#ba855e] uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-[#ba855e]" />
                      <span>BURADA BULUNAN YÖRESEL LEZZET</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#ba855e] shadow-xs">
                        <img
                          src={selectedPlaceDish.imageUrl}
                          alt={selectedPlaceDish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="font-display text-[15px] font-semibold text-[#1b3a2d] block leading-tight">
                          {selectedPlaceDish.name}
                        </strong>
                        <span className="text-[11px] text-[#6d6b5f] font-sans line-clamp-1 mt-0.5">
                          {selectedPlaceDish.tagline || selectedPlaceDish.categoryLabel}
                        </span>
                      </div>
                      {onPreviewDish && (
                        <button
                          type="button"
                          onClick={() => onPreviewDish(selectedPlaceDish)}
                          className="px-2 py-1 text-[10px] font-semibold bg-[#203b31] text-white rounded-2xs hover:bg-[#162e25] transition-colors shrink-0"
                        >
                          Tarifi Gör
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* İşletme Başlığı */}
                <h3 className="font-display text-xl font-normal text-[#1b3a2d] mb-1 leading-snug">
                  {selectedPlace.name}
                </h3>

                <p className="text-xs text-[#555f55] leading-relaxed mb-3 font-sans">
                  {selectedPlace.description}
                </p>

                {/* Açık Adres */}
                <div className="flex items-start gap-2 text-xs text-[#3d4a3e] bg-[#f7f2e7] p-2.5 rounded-2xs mb-3">
                  <MapPin className="w-4 h-4 text-[#ba855e] shrink-0 mt-0.5" />
                  <div className="flex-1 font-sans">
                    <strong className="block text-[11px] font-semibold text-[#203b31] uppercase font-mono">
                      Açık Adres
                    </strong>
                    <span>{selectedPlace.address}</span>
                  </div>
                </div>

                {/* Ziyaret Saatleri (Doğrulanmışsa) */}
                {selectedPlace.visitingHours && (
                  <div className="flex items-center gap-2 text-xs text-[#555f55] mb-3 px-1">
                    <Clock className="w-3.5 h-3.5 text-[#ba855e]" />
                    <span>Ziyaret Saatleri: {selectedPlace.visitingHours}</span>
                  </div>
                )}

                {/* Doğrulama / Kaynak Bilgisi */}
                {selectedPlace.verificationSource && (
                  <div className="text-[10px] text-[#7a7161] font-mono mb-3 px-1 border-t border-[#dfd2c0] pt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-[#203b31]" />
                    <span>Doğrulama: {selectedPlace.verificationSource}</span>
                  </div>
                )}

                {/* YOL TARİFİ AL BUTONU (Gerçek Google Maps Harita Navigasyonu) */}
                {selectedPlace.coordinates && (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenDirections(
                        selectedPlace.coordinates!.lat,
                        selectedPlace.coordinates!.lng
                      )
                    }
                    className="w-full bg-[#203b31] hover:bg-[#162e25] text-white py-2.5 px-3 rounded-xs text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#ba855e]" />
                    <span>Google Haritalar’da Yol Tarifi Al</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                )}
              </div>
            ) : filteredPlaces.length > 0 ? (
              /* 4. DURUM B: DOĞRULANMIŞ NOKTALAR LİSTESİ */
              <div className="space-y-2 mb-4">
                {filteredPlaces.map((place) => {
                  const placeDish = place.relatedDishIds?.[0]
                    ? allDishes.find((d) => d.id === place.relatedDishIds![0])
                    : null;

                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left p-3 rounded-xs bg-[#fffdf8] border border-[#dccbb3] hover:border-[#ba855e] hover:bg-[#faf4ea] transition-all duration-200 flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        {placeDish && (
                          <span className="text-[10px] font-mono font-bold text-[#ba855e] block mb-0.5 truncate">
                            ● Lezzet: {placeDish.name}
                          </span>
                        )}
                        <h4 className="font-display text-sm font-semibold text-[#1b3a2d] truncate">
                          {place.name}
                        </h4>
                        <p className="text-[11px] text-[#6d6b5f] font-sans truncate">
                          {place.address}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8d765e] group-hover:text-[#ba855e] shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            ) : (
              /* 4. DURUM C: SIFIR NOKTA DURUMU */
              <div className="bg-[#fffdf8] border border-[#dccbb3] rounded-xs p-5 sm:p-6 text-center my-2 shadow-xs">
                <div className="w-11 h-11 rounded-full bg-[#f4ecd8] border border-[#d5c2aa] flex items-center justify-center text-[#ba855e] mx-auto mb-3">
                  <MapPin className="w-5 h-5" />
                </div>

                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#936645] font-bold block mb-1">
                  SAHA DOĞRULAMA ENVENTERİ
                </span>

                <h3 className="text-base sm:text-lg font-display font-medium text-[#1b3a2d] mb-2 leading-snug">
                  Seçilen Filtreye Uygun Ziyaret Noktası Bulunamadı
                </h3>

                <p className="text-xs text-[#555f55] leading-relaxed font-sans mb-4 max-w-sm mx-auto">
                  Aramayı veya lezzet filtresini sıfırlayarak tüm durakları görebilirsiniz.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDishFilter('all');
                  }}
                  className="w-full py-2 px-3 rounded-xs bg-[#203b31] text-[#fff9e9] text-xs font-semibold uppercase tracking-wider hover:bg-[#162e25] transition-colors shadow-xs"
                >
                  Filtreleri Sıfırla
                </button>
              </div>
            )}
          </div>

          {/* Dipnot / Kaynak Bildirimi */}
          <div className="pt-3 mt-4 border-t border-[#dfd2c0] text-[10px] text-[#7a7161] font-sans leading-tight">
            <span className="block mb-0.5">
              <strong>Harita Tabanı:</strong> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#203b31]">OpenStreetMap</a> contributors.
            </span>
            <span>
              Yalnızca editoryal onayı tamamlanan fiziki noktalar listelenir; tahmini konum ataması yapılmaz.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
};
