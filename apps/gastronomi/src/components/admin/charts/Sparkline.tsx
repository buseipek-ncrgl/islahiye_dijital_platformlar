import React from 'react';

interface SparklineProps {
  data: number[];
  color?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
  width?: number;
  height?: number;
  className?: string;
}

const COLOR_MAP = {
  emerald: {
    stroke: '#059669',
    fill: 'rgba(16, 185, 129, 0.15)',
  },
  blue: {
    stroke: '#2563eb',
    fill: 'rgba(59, 130, 246, 0.15)',
  },
  amber: {
    stroke: '#d97706',
    fill: 'rgba(245, 158, 11, 0.15)',
  },
  purple: {
    stroke: '#7c3aed',
    fill: 'rgba(139, 92, 246, 0.15)',
  },
  slate: {
    stroke: '#475569',
    fill: 'rgba(100, 116, 139, 0.15)',
  },
};

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = 'emerald',
  width = 84,
  height = 28,
  className = '',
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const effectiveHeight = height - padding * 2;
  const effectiveWidth = width - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * effectiveWidth;
    const y = padding + effectiveHeight - ((val - min) / range) * effectiveHeight;
    return { x, y };
  });

  // Build SVG path
  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Build closed area path for gradient fill
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaD = `${pathD} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

  const theme = COLOR_MAP[color] || COLOR_MAP.emerald;
  const gradId = `spark-grad-${color}-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={theme.stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Fill Area */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Stroke Line */}
      <path
        d={pathD}
        fill="none"
        stroke={theme.stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End Point Pulsing Dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="2.5"
        fill={theme.stroke}
      />
    </svg>
  );
};

