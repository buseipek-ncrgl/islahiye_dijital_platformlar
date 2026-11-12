import React, { useState, useEffect, useRef } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
  containerClassName?: string;
  compact?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackText = 'İslahiye Gastronomi',
  className = '',
  containerClassName = '',
  compact = false,
  ...props
}) => {
  const hasValidSrc = Boolean(src && src.trim().length > 0);
  const [hasError, setHasError] = useState(!hasValidSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const valid = Boolean(src && src.trim().length > 0);
    setHasError(!valid);
    setIsLoaded(false);

    if (valid && imgRef.current?.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        setHasError(true);
      }
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#EFE8DC]/50 ${containerClassName}`}>
      {/* Warm Editorial Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[#E8DFD1]/50 animate-pulse pointer-events-none" />
      )}

      {!hasError && hasValidSrc ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      ) : compact ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F6F2E9] text-[#BA855E]/60 border border-[#DCCAB2]/40">
          <UtensilsCrossed className="w-4 h-4 text-[#BA855E]/70" />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-[#F6F2E9] border border-[#DCCAB2]/80">
          <div className="w-8 h-8 rounded-full bg-[#E8DFD1] text-[#936645] flex items-center justify-center mb-1.5 shadow-2xs">
            <UtensilsCrossed className="w-4 h-4 text-[#BA855E]" />
          </div>
          <span className="text-[#203B31] text-xs font-serif font-medium max-w-[170px] leading-tight truncate">
            {fallbackText}
          </span>
          <span className="text-[9px] text-[#936645] mt-1 uppercase tracking-[0.18em] font-sans font-bold">
            Görsel Arşivde
          </span>
        </div>
      )}
    </div>
  );
};
