import React from 'react';
import { Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectedId?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  className?: string;
}

/**
 * Platform Genelinde Standart DataTable Bileşeni
 * Sticky header (sabit başlık), dikey kaydırılabilir gövde,
 * yatay mobil responsive sarmalayıcı ve opak başlık desteği sunar.
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedId,
  emptyMessage = 'Kayıt bulunamadı.',
  isLoading = false,
  stickyHeader = true,
  maxHeight = 'max-h-[580px]',
  className = '',
}: DataTableProps<T>): React.ReactElement {
  return (
    <div
      className={`w-full overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs ${
        stickyHeader && maxHeight ? `${maxHeight} overflow-y-auto relative` : ''
      } ${className}`}
    >
      <table className="w-full text-left text-xs border-collapse">
        <thead
          className={`bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 select-none ${
            stickyHeader ? 'sticky top-0 z-10 bg-slate-50 shadow-2xs' : ''
          }`}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`py-3 px-4 bg-slate-50 ${
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-900">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-10 text-center text-slate-400">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Veriler yükleniyor...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{emptyMessage}</span>
                  <span className="text-[11px] text-slate-400">
                    Aktif arama kriterlerinizi değiştirerek yeniden deneyebilirsiniz.
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const id = keyExtractor(item);
              const isSelected = selectedId === id;

              return (
                <tr
                  key={id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'bg-blue-50/80 hover:bg-blue-50 text-blue-950 font-medium'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item)
                        : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
