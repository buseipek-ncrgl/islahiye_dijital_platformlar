import React, { useState } from 'react';

export interface TrendPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface TrendLineChartProps {
  data: TrendPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  fillColor?: string;
  className?: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  title,
  subtitle,
  height = 200,
  color = '#059669',
  className = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 600; // SVG viewBox width
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 10);
  const minVal = 0;

  const getX = (index: number) => {
    return padLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal);
    return padTop + chartHeight - ratio * chartHeight;
  };

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.value),
    label: d.label,
    value: d.value,
  }));

  // Create smooth bezier curve path
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[0];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return d;
  };

  const pathD = createSmoothPath(points);
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`;

  // Grid line levels (0%, 50%, 100%)
  const gridLevels = [
    { value: maxVal, y: getY(maxVal) },
    { value: Math.round(maxVal / 2), y: getY(maxVal / 2) },
    { value: 0, y: getY(0) },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h4 className="text-sm font-bold text-slate-900">{title}</h4>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {hoveredIdx !== null && (
            <div className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-sans">
              {data[hoveredIdx].label}: <strong className="tabular-nums">{data[hoveredIdx].value} Kayıt</strong>
            </div>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="trend-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="90%" stopColor={color} stopOpacity="0.02" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {gridLevels.map((gl, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={gl.y}
                x2={width - padRight}
                y2={gl.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={gl.y + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-sans tabular-nums font-medium"
              >
                {gl.value}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          <path d={areaD} fill="url(#trend-area-grad)" />

          {/* Curve Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Interactive Dots */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible larger hover target */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200"
                />

                {/* X-axis label */}
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

