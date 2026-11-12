import React, { useState } from 'react';

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  sublabel?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerTitle?: string;
  centerSubtitle?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  centerTitle,
  centerSubtitle,
  size = 180,
  strokeWidth = 24,
  className = '',
}) => {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
      {/* SVG Donut Circle */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg] overflow-visible"
        >
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Value Segments */}
          {total > 0 &&
            segments.map((segment) => {
              const percent = segment.value / total;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              const isHovered = activeSegmentId === segment.id;

              return (
                <circle
                  key={segment.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveSegmentId(segment.id)}
                  onMouseLeave={() => setActiveSegmentId(null)}
                />
              );
            })}
        </svg>

        {/* Center Text inside Donut hole */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {centerTitle && (
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none tracking-tight">
              {centerTitle}
            </span>
          )}
          {centerSubtitle && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
              {centerSubtitle}
            </span>
          )}
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="flex-1 w-full space-y-2">
        {segments.map((segment) => {
          const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          const isHovered = activeSegmentId === segment.id;

          return (
            <div
              key={segment.id}
              onMouseEnter={() => setActiveSegmentId(segment.id)}
              onMouseLeave={() => setActiveSegmentId(null)}
              className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                isHovered
                  ? 'bg-slate-50 border-slate-300 shadow-2xs'
                  : 'border-transparent hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-md shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 block truncate">
                    {segment.label}
                  </span>
                  {segment.sublabel && (
                    <span className="text-[10px] text-slate-400 block truncate">
                      {segment.sublabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <span className="font-bold text-slate-900 block font-sans tabular-nums">
                  {segment.value}
                </span>
                <span className="text-[10px] text-slate-500 font-sans tabular-nums">
                  %{percent}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

