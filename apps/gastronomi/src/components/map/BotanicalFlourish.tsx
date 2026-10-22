import React from 'react';

/**
 * Antique botanical olive branch engraving for the top-left corner
 */
export const OliveBranchCorner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none text-[#8d765e] opacity-75 ${className}`}
    aria-hidden="true"
  >
    {/* Main curving stem */}
    <path
      d="M 12 12 C 35 15, 75 40, 95 85 C 108 115, 120 138, 148 152"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M 18 10 C 28 25, 42 60, 48 95"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />

    {/* Olive leaves along stem */}
    {/* Leaf 1 */}
    <path
      d="M 32 24 C 20 28, 14 42, 22 50 C 32 46, 38 34, 32 24 Z"
      fill="#203b31"
      fillOpacity="0.12"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path d="M 22 50 Q 28 36 32 24" stroke="currentColor" strokeWidth="0.7" />

    {/* Leaf 2 */}
    <path
      d="M 52 38 C 50 24, 62 14, 72 20 C 74 32, 64 42, 52 38 Z"
      fill="#203b31"
      fillOpacity="0.12"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path d="M 52 38 Q 62 28 72 20" stroke="currentColor" strokeWidth="0.7" />

    {/* Leaf 3 */}
    <path
      d="M 68 58 C 55 64, 46 80, 58 88 C 70 82, 76 68, 68 58 Z"
      fill="#203b31"
      fillOpacity="0.12"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path d="M 58 88 Q 64 72 68 58" stroke="currentColor" strokeWidth="0.7" />

    {/* Leaf 4 */}
    <path
      d="M 88 74 C 92 60, 108 52, 116 62 C 114 76, 102 84, 88 74 Z"
      fill="#203b31"
      fillOpacity="0.12"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path d="M 88 74 Q 102 68 116 62" stroke="currentColor" strokeWidth="0.7" />

    {/* Leaf 5 */}
    <path
      d="M 102 105 C 88 114, 82 132, 94 138 C 106 130, 112 116, 102 105 Z"
      fill="#203b31"
      fillOpacity="0.12"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path d="M 94 138 Q 98 122 102 105" stroke="currentColor" strokeWidth="0.7" />

    {/* Olives hanging */}
    <ellipse cx="44" cy="54" rx="5.5" ry="7" transform="rotate(-20 44 54)" fill="#ba855e" fillOpacity="0.25" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="80" cy="88" rx="5.5" ry="7" transform="rotate(25 80 88)" fill="#ba855e" fillOpacity="0.25" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="118" cy="115" rx="5.5" ry="7" transform="rotate(-15 118 115)" fill="#ba855e" fillOpacity="0.25" stroke="currentColor" strokeWidth="1" />

    {/* Subtle fine hatch lines */}
    <line x1="16" y1="16" x2="26" y2="20" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 2" />
    <line x1="28" y1="28" x2="38" y2="34" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 2" />
  </svg>
);

/**
 * Antique wheat & garlic botanical engraving for the bottom-right corner
 */
export const WheatCorner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none text-[#8d765e] opacity-75 ${className}`}
    aria-hidden="true"
  >
    {/* Curving wheat stems */}
    <path
      d="M 148 148 C 125 145, 85 120, 65 75 C 52 45, 40 22, 12 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M 142 150 C 132 135, 118 100, 112 65"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />

    {/* Wheat ear grains */}
    <path d="M 68 76 C 58 72, 54 60, 62 52 C 72 56, 76 68, 68 76 Z" fill="#ba855e" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
    <path d="M 52 58 C 42 54, 38 42, 46 34 C 56 38, 60 50, 52 58 Z" fill="#ba855e" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
    <path d="M 36 40 C 26 36, 22 24, 30 16 C 40 20, 44 32, 36 40 Z" fill="#ba855e" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
    <path d="M 22 22 C 14 18, 10 8, 16 2 C 24 6, 28 16, 22 22 Z" fill="#ba855e" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />

    {/* Garlic bulb motif in corner */}
    <path
      d="M 115 110 C 105 105, 95 115, 98 128 C 100 142, 120 148, 132 142 C 144 135, 142 120, 134 112 C 126 104, 118 102, 115 110 Z"
      fill="#f4ece0"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path d="M 115 110 C 112 120, 115 135, 122 144" stroke="currentColor" strokeWidth="0.8" />
    <path d="M 115 110 C 124 118, 128 130, 132 142" stroke="currentColor" strokeWidth="0.8" />
    <path d="M 114 108 L 112 100 L 118 102" stroke="currentColor" strokeWidth="1" />
  </svg>
);
