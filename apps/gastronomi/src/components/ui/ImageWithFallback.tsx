import React, { useState } from 'react';
import { Utensils } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
  containerClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackText = 'İslahiye Gastronomi Mirası',
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-sand/30 ${containerClassName}`}>
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-sand/20 animate-pulse" />
      )}

      {!hasError ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-sand/30 border border-sand/50">
          <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-2">
            <Utensils className="w-6 h-6 text-copper" />
          </div>
          <span className="font-display text-forest text-base font-semibold max-w-[200px] leading-tight">
            {fallbackText}
          </span>
          <span className="text-[11px] text-charcoal/60 mt-1 uppercase tracking-widest">
            Temsili Görsel
          </span>
        </div>
      )}
    </div>
  );
};
