import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export interface BarChartItem {
  id: string;
  label: string;
  value: number;
  color?: string;
  secondaryText?: string;
  to?: string;
}

interface BarChartProps {
  items: BarChartItem[];
  orientation?: 'horizontal' | 'vertical';
  maxVal?: number;
  showPercent?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  items,
  orientation = 'horizontal',
  maxVal,
  showPercent = true,
  className = '',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const highest = maxVal || Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((acc, i) => acc + i.value, 0);

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
          {items.map((item) => {
            const heightPercent = Math.round((item.value / highest) * 100);
            const isHovered = hoveredId === item.id;
            const barColor = item.color || '#059669';

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {/* Floating tooltip */}
                {isHovered && (
                  <div className="absolute -top-8 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-sans font-medium whitespace-nowrap shadow-md z-10 pointer-events-none">
                    {item.label}: <strong className="tabular-nums">{item.value}</strong>
                  </div>
                )}

                {/* Vertical Bar */}
                <div
                  style={{
                    height: `${Math.max(heightPercent, 6)}%`,
                    backgroundColor: barColor,
                  }}
                  className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 ${
                    isHovered ? 'brightness-110 shadow-xs' : 'opacity-90'
                  }`}
                />

                <span className="text-[10px] font-sans text-slate-500 font-semibold mt-1 tabular-nums">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* X-axis Labels */}
        <div className="flex justify-between gap-3 px-2 text-[11px] font-medium text-slate-500">
          {items.map((item) => (
            <span key={item.id} className="flex-1 text-center truncate" title={item.label}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Horizontal Mode (Standard high-density list)
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const widthPercent = Math.round((item.value / highest) * 100);
        const barColor = item.color || '#059669';
        const isHovered = hoveredId === item.id;

        const rowContent = (
          <div
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`p-2.5 rounded-lg border transition-all ${
              isHovered
                ? 'bg-slate-50 border-slate-300 shadow-2xs'
                : 'border-transparent hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-800 truncate mr-2">
                {item.label}
              </span>
              <div className="flex items-center gap-2 font-sans text-[11px] shrink-0">
                <span className="font-bold text-slate-900 tabular-nums">{item.value}</span>
                {showPercent && (
                  <span className="text-slate-400 tabular-nums">({percent}%)</span>
                )}
              </div>
            </div>

            {/* Track & Bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: barColor,
                }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isHovered ? 'brightness-110' : ''
                }`}
              />
            </div>

            {item.secondaryText && (
              <span className="text-[10px] text-slate-400 block mt-1">
                {item.secondaryText}
              </span>
            )}
          </div>
        );

        if (item.to) {
          return (
            <Link key={item.id} to={item.to} className="block">
              {rowContent}
            </Link>
          );
        }

        return <div key={item.id}>{rowContent}</div>;
      })}
    </div>
  );
};

