import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Check,
  Monitor,
  UtensilsCrossed,
  Video,
  LayoutGrid,
  List,
  Search,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  FacilityRoom,
  getStoredFacilities,
} from '../../services/facilityCatalogService';

interface VenuePickerProps {
  value: string;
  onChange: (locationName: string) => void;
  customValue?: string;
  onCustomChange?: (customName: string) => void;
  label?: string;
  required?: boolean;
}

export const VenuePicker: React.FC<VenuePickerProps> = ({
  value,
  onChange,
  customValue = '',
  onCustomChange,
  label = 'Derslik / Eğitim Mekânı',
  required = true,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const facilities = useMemo(() => getStoredFacilities(), []);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (typeFilter !== 'all' && f.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchFloor = f.floor.toLowerCase().includes(q);
        const matchFeatures = f.features.some((feat) => feat.toLowerCase().includes(q));
        return matchName || matchFloor || matchFeatures;
      }
      return true;
    });
  }, [facilities, typeFilter, searchQuery]);

  const getVenueIcon = (type: FacilityRoom['type']) => {
    switch (type) {
      case 'computer_lab':
        return <Monitor className="w-4 h-4 text-indigo-600" />;
      case 'workshop':
        return <UtensilsCrossed className="w-4 h-4 text-amber-600" />;
      case 'conference_hall':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'online':
        return <Video className="w-4 h-4 text-emerald-600" />;
      default:
        return <Building2 className="w-4 h-4 text-blue-600" />;
    }
  };

  const isCustomSelected = value === 'custom';

  return (
    <div className="space-y-2.5 text-xs">
      {/* Header with Label and View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label className="font-semibold text-slate-800">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            ({filteredFacilities.length} Mekân)
          </span>
        </div>

        {/* View Switcher & Search Bar */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartlar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Liste Görünümü"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'classroom', label: 'Derslik' },
            { id: 'computer_lab', label: 'Bilişim' },
            { id: 'workshop', label: 'Atölye' },
            { id: 'conference_hall', label: 'Salon' },
            { id: 'online', label: 'Online' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition shrink-0 ${
                typeFilter === t.id
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Mekân veya özellik ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 text-[11px] border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* VIEW MODE 1: CARD / GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
          {filteredFacilities.map((facility) => {
            const isSelected = value === facility.name;

            return (
              <div
                key={facility.id}
                onClick={() => onChange(facility.name)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        {getVenueIcon(facility.type)}
                      </div>
                      <span className="font-bold text-slate-900 text-xs leading-snug block break-words" title={facility.name}>
                        {facility.name}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1.5">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {facility.floor}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 font-medium text-slate-700">
                      <Users className="w-3 h-3 text-slate-400" />
                      {facility.capacity} Kursiyer
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {facility.features.slice(0, 2).map((feat) => (
                      <span
                        key={feat}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        {feat}
                      </span>
                    ))}
                    {facility.features.length > 2 && (
                      <span className="text-[9px] text-slate-400 self-center">
                        +{facility.features.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Custom Venue Card */}
          <div
            onClick={() => onChange('custom')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-center items-center text-center ${
              isCustomSelected
                ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500 shadow-2xs'
                : 'border-dashed border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/20'
            }`}
          >
            <Plus className="w-5 h-5 text-blue-600 mb-1" />
            <span className="text-xs font-bold text-slate-800">+ Yeni Derslik Tanımla</span>
            <span className="text-[10px] text-slate-400">Katalog dışı özel salon</span>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: LIST / TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3 w-8">Seç</th>
                <th className="py-2 px-3">Derslik & Mekân</th>
                <th className="py-2 px-3">Konum & Kat</th>
                <th className="py-2 px-3 text-center">Kapasite</th>
                <th className="py-2 px-3">Donanım</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFacilities.map((facility) => {
                const isSelected = value === facility.name;

                return (
                  <tr
                    key={facility.id}
                    onClick={() => onChange(facility.name)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-blue-50/90 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Radio Select */}
                    <td className="py-2 px-3 text-center">
                      <div
                        className={`w-4 h-4 rounded-full border mx-auto flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </td>

                    {/* Venue Name & Type */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                          {getVenueIcon(facility.type)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-snug">
                            {facility.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{facility.typeLabel}</div>
                        </div>
                      </div>
                    </td>

                    {/* Floor */}
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {facility.floor}
                      </span>
                    </td>

                    {/* Capacity */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[10px]">
                        {facility.capacity} Kursiyer
                      </span>
                    </td>

                    {/* Features */}
                    <td className="py-2 px-3 text-slate-500">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {facility.features.slice(0, 2).map((feat) => (
                          <span
                            key={feat}
                            className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-600"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Custom Option Row in List View */}
              <tr
                onClick={() => onChange('custom')}
                className={`cursor-pointer transition ${
                  isCustomSelected ? 'bg-blue-50/90 font-medium' : 'hover:bg-slate-50'
                }`}
              >
                <td className="py-2.5 px-3 text-center">
                  <div
                    className={`w-4 h-4 rounded-full border mx-auto flex items-center justify-center ${
                      isCustomSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isCustomSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </td>
                <td colSpan={4} className="py-2.5 px-3 text-blue-700 font-semibold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yeni Derslik / Salon Tanımla...</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Custom input if custom selected */}
      {isCustomSelected && (
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1 animate-in fade-in">
          <label className="block text-[11px] font-bold text-blue-950">
            Yeni Derslik / Konum Adı:
          </label>
          <input
            type="text"
            value={customValue}
            onChange={(e) => onCustomChange && onCustomChange(e.target.value)}
            placeholder="Örn: İE Tasarım ve İnovasyon Atölyesi (Kat 3)"
            className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-[10px] text-slate-500">
            Tanımlanan bu yeni derslik otomatik olarak kurumsal mekân kataloğuna eklenecektir.
          </p>
        </div>
      )}

      {/* Selected Venue Summary Pill */}
      {value && value !== 'custom' && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200 text-[11px] text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Seçilen Mekân:</span>
            <strong className="text-slate-900">{value}</strong>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Rezervasyona Uygun
          </span>
        </div>
      )}
    </div>
  );
};

