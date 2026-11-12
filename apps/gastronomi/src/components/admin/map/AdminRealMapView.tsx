import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { GastronomyPlace } from '../../../types';
import islahiyeDistrictBoundaryGeojson from '../../../data/geo/islahiye-district.json';

export const ISLAHIYE_TOWN_CENTER: [number, number] = [37.025678, 36.631868];
export const ISLAHIYE_DEFAULT_ZOOM = 13;

export const ISLAHIYE_BBOX_BOUNDS: [[number, number], [number, number]] = [
  [36.825573, 36.4434139],
  [37.1517102, 36.964505],
];

export const ISLAHIYE_MAX_BOUNDS: [[number, number], [number, number]] = [
  [36.75, 36.35],
  [37.22, 37.05],
];

const escapeHtml = (unsafe: string): string =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface AdminRealMapViewProps {
  places: GastronomyPlace[];
  selectedPlaceId?: string | null;
  onSelectPlace: (place: GastronomyPlace | null) => void;
  onNewPlaceAtCoords?: (lat: number, lng: number) => void;
  className?: string;
}

export const AdminRealMapView: React.FC<AdminRealMapViewProps> = ({
  places,
  selectedPlaceId = null,
  onSelectPlace,
  onNewPlaceAtCoords,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clickedMarkerRef = useRef<L.Marker | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Filter out places without coordinates
  const validPlaces = useMemo(() => {
    return places.filter(
      (p) =>
        p.coordinates &&
        typeof p.coordinates.lat === 'number' &&
        typeof p.coordinates.lng === 'number' &&
        !isNaN(p.coordinates.lat) &&
        !isNaN(p.coordinates.lng)
    );
  }, [places]);

  // Initialize Leaflet map
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
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap standard tile layer
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        maxZoom: 19,
        minZoom: 11,
      }).addTo(map);

      // Outer inverse mask and İslahiye district boundary
      try {
        const rawCoords = islahiyeDistrictBoundaryGeojson.features[0].geometry.coordinates[0] as [
          number,
          number
        ][];
        const islahiyeLatLngs: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon]);

        const worldOuterRing: [number, number][] = [
          [85, -180],
          [85, 180],
          [-85, 180],
          [-85, -180],
        ];

        // Mask outer region with neutral background
        const maskPolygon = L.polygon([worldOuterRing, islahiyeLatLngs], {
          fillColor: '#f1f5f9',
          fillOpacity: 0.92,
          stroke: false,
          interactive: false,
        });
        maskPolygon.addTo(map);

        // Highlight district boundary with emerald border
        const boundaryLine = L.polyline(islahiyeLatLngs, {
          color: '#059669',
          weight: 2.5,
          dashArray: '6, 5',
          interactive: false,
        });
        boundaryLine.addTo(map);
      } catch (e) {
        console.warn('İslahiye sınır katmanı yüklenemedi:', e);
      }

      // LayerGroup for place markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      // Click on map to pick coordinate
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const roundedLat = parseFloat(lat.toFixed(5));
        const roundedLng = parseFloat(lng.toFixed(5));
        setClickedCoords({ lat: roundedLat, lng: roundedLng });

        // Add or move temporary clicked marker
        if (clickedMarkerRef.current) {
          clickedMarkerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          const tempIcon = L.divIcon({
            className: 'admin-temp-click-pin',
            html: `
              <div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
                <div style="position:absolute;width:28px;height:28px;background:rgba(239,68,68,0.25);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
                <div style="width:14px;height:14px;background:#ef4444;border:2.5px solid #ffffff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const marker = L.marker([roundedLat, roundedLng], { icon: tempIcon }).addTo(map);
          clickedMarkerRef.current = marker;
        }
      });

      // Fit to initial district bounds
      map.fitBounds(ISLAHIYE_BBOX_BOUNDS, {
        padding: [24, 24],
        maxZoom: 14,
      });

      mapInstanceRef.current = map;

      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);

      let rAF: number | null = null;
      const resizeObserver = new ResizeObserver(() => {
        if (rAF !== null) cancelAnimationFrame(rAF);
        rAF = requestAnimationFrame(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        clearTimeout(timer);
        if (rAF !== null) cancelAnimationFrame(rAF);
        resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch (err) {
      console.error('Leaflet harita başlatılamadı:', err);
    }
  }, []);

  // Update markers when places or selectedPlaceId changes
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    validPlaces.forEach((place) => {
      const isSelected = place.id === selectedPlaceId;
      const isPublished = place.publicationStatus === 'published';

      // Category color styles & SVG icons
      let pinColor = '#059669'; // default emerald
      let catBadgeText = place.categoryLabel || 'Gastronomi Noktası';
      let pinSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/></svg>`;

      if (place.category === 'restaurant') {
        catBadgeText = 'Lokanta';
      } else if (place.category === 'bakery' || place.category === 'oven') {
        pinColor = '#d97706'; // amber for stone ovens
        catBadgeText = 'Taş Fırın';
        pinSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
      } else if (place.category === 'cooperative' || place.category === 'producer') {
        pinColor = '#0284c7'; // sky for producers / cooperatives
        catBadgeText = 'Üretici';
        pinSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0 4.94Z"/></svg>`;
      } else if (place.category === 'market') {
        pinColor = '#7c3aed'; // purple for markets
        catBadgeText = 'Pazar';
        pinSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`;
      } else if (place.category === 'cultural_site') {
        pinColor = '#0d9488'; // teal for cultural heritage sites
        catBadgeText = 'Kültürel Alan';
        pinSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`;
      }

      const pubStatus = place.publicationStatus || 'published';
      const statusLabel =
        pubStatus === 'published'
          ? 'Yayında'
          : pubStatus === 'in_review'
          ? 'İncelemede'
          : pubStatus === 'archived'
          ? 'Arşivde'
          : 'Taslak';
      const statusColor =
        pubStatus === 'published'
          ? '#059669'
          : pubStatus === 'in_review'
          ? '#0284c7'
          : pubStatus === 'archived'
          ? '#64748b'
          : '#d97706';

      const customIcon = L.divIcon({
        className: 'admin-place-pin',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
            ${isSelected ? `
              <div style="
                position: absolute;
                top: -32px;
                padding: 3px 8px;
                background: #0f172a;
                color: #ffffff;
                font-family: ui-sans-serif, system-ui, sans-serif;
                font-size: 11px;
                font-weight: 700;
                white-space: nowrap;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 1px solid #334155;
                display: flex;
                align-items: center;
                gap: 5px;
                z-index: 2000;
              ">
                <span style="width:6px;height:6px;border-radius:50%;background:${isPublished ? '#10b981' : '#f59e0b'};"></span>
                <span>${escapeHtml(place.name)}</span>
              </div>
            ` : ''}

            <div style="
              width: ${isSelected ? '38px' : '32px'};
              height: ${isSelected ? '38px' : '32px'};
              background: ${pinColor};
              border: ${isSelected ? '3px solid #ffffff' : '2.5px solid #ffffff'};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: ${isSelected ? '0 0 0 4px rgba(16,185,129,0.4), 0 8px 18px rgba(0,0,0,0.35)' : '0 3px 8px rgba(0,0,0,0.22)'};
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                ${pinSvg}
              </div>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 36],
      });

      const marker = L.marker([place.coordinates!.lat, place.coordinates!.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 100,
      });

      marker.bindTooltip(
        `<div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; line-height: 1.3;">
           <strong style="display:block; font-weight:700; color:#0f172a; font-size:12px;">${escapeHtml(place.name)}</strong>
           <div style="display:flex; align-items:center; gap:6px; color:#64748b; font-size:10px; font-family:monospace; margin-top:2px;">
             <span style="padding:1px 5px; background:#f1f5f9; border-radius:3px; font-weight:600; color:#334155;">${escapeHtml(catBadgeText)}</span>
             <span>${escapeHtml(place.districtOrNeighborhood || 'İslahiye')}</span>
             <span>•</span>
             <span style="color:${statusColor}; font-weight:700;">${statusLabel}</span>
           </div>
         </div>`,
        {
          direction: 'top',
          offset: [0, -32],
          opacity: 1,
          className: 'admin-marker-custom-tooltip',
        }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectPlace(place);
        setClickedCoords(null);
        if (clickedMarkerRef.current) {
          clickedMarkerRef.current.remove();
          clickedMarkerRef.current = null;
        }

        // Center map smoothly on selected place
        const map = mapInstanceRef.current;
        if (map) {
          map.panTo([place.coordinates!.lat, place.coordinates!.lng], {
            animate: true,
            duration: 0.5,
          });
        }
      });

      marker.addTo(markersLayer);
    });
  }, [validPlaces, selectedPlaceId, onSelectPlace]);

  // Center on selected place when selection changes externally (e.g. from table)
  useEffect(() => {
    if (!selectedPlaceId || !mapInstanceRef.current) return;
    const targetPlace = validPlaces.find((p) => p.id === selectedPlaceId);
    if (targetPlace?.coordinates) {
      mapInstanceRef.current.setView(
        [targetPlace.coordinates.lat, targetPlace.coordinates.lng],
        15,
        { animate: true }
      );
    }
  }, [selectedPlaceId, validPlaces]);

  // Reset to full district bounds
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.fitBounds(ISLAHIYE_BBOX_BOUNDS, {
      padding: [24, 24],
      maxZoom: 13,
      animate: true,
    });
    setClickedCoords(null);
    if (clickedMarkerRef.current) {
      clickedMarkerRef.current.remove();
      clickedMarkerRef.current = null;
    }
  };

  return (
    <div className={`relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 ${className}`}>
      {/* Top Floating Map Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* District Boundary Tag */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-sans">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-800">İslahiye İlçe Haritası</span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-600 font-medium">
            {validPlaces.length} Harita Noktası
          </span>
        </div>

        {/* Reset View Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetView}
            className="bg-white/95 backdrop-blur-xs hover:bg-white text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer"
            title="Tüm İslahiye sınırına odaklan"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sınırlara Odakla</span>
          </button>
        </div>
      </div>

      {/* Floating Clicked Coordinates Action Bar */}
      {clickedCoords && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-30 bg-white/95 text-slate-800 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in max-w-lg">
          <div className="flex items-center gap-2.5 text-xs font-sans">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Haritada Nokta Seçildi</div>
              <div className="text-[11px] font-sans text-slate-500 tabular-nums">
                Enlem: {clickedCoords.lat} • Boylam: {clickedCoords.lng}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNewPlaceAtCoords && (
              <button
                type="button"
                onClick={() => onNewPlaceAtCoords(clickedCoords.lat, clickedCoords.lng)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bu Konuma Ekle</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setClickedCoords(null);
                if (clickedMarkerRef.current) {
                  clickedMarkerRef.current.remove();
                  clickedMarkerRef.current = null;
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map DOM Node */}
      <div
        ref={mapContainerRef}
        className="w-full h-[520px] sm:h-[600px] z-10"
        style={{ background: '#f1f5f9' }}
      />
    </div>
  );
};
