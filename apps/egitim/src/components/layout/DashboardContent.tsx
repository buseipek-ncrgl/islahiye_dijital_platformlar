import React from 'react';

interface DashboardContentProps {
  children: React.ReactNode;
  /** İsteğe bağlı tam genişlik tablolama alanı (örn. devasa veri tabloları) */
  fullWidth?: boolean;
  className?: string;
}

/**
 * Merkezi İçerik Hizalama ve Genişlik Standardı Bileşeni
 * Standart: Masaüstü 32px (p-8), Tablet 24px (p-6), Mobil 16px (p-4)
 * Maksimum İçerik Genişliği: 1360px (max-w-[1360px])
 */
export const DashboardContent: React.FC<DashboardContentProps> = ({
  children,
  fullWidth = false,
  className = '',
}) => {
  return (
    <div
      className={`w-full ${
        fullWidth ? 'max-w-full' : 'max-w-[1360px]'
      } mx-auto space-y-6 md:space-y-8 ${className}`}
    >
      {children}
    </div>
  );
};
