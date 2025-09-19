import React, { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  lazy?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  aspectRatio?: string; // e.g., "4/3", "16/9", "1/1"
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  sizes?: string; // responsive image sizes
  priority?: boolean; // for above-the-fold images
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  errorFallback?: React.ReactNode;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  lazy = true,
  placeholder = 'skeleton',
  aspectRatio,
  objectFit = 'cover',
  sizes,
  priority = false,
  onLoad,
  onError,
  onClick,
  errorFallback,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use optimized intersection observer
  const { isInView, elementRef } = useIntersectionObserver(lazy, priority);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    onError?.();
  };

  const showPlaceholder = !isInView || (!imageLoaded && !imageError);
  const showError = imageError && !imageLoaded;

  const containerStyles = {
    aspectRatio: aspectRatio || undefined,
  };

  const Placeholder = () => {
    if (placeholder === 'skeleton') {
      return (
        <div className="bg-muted animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50" />
        </div>
      );
    }
    if (placeholder === 'blur') {
      return (
        <div className="bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
      );
    }
    return null;
  };

  const ErrorFallback = () => {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }
    return (
      <div className="bg-muted flex items-center justify-center text-muted-foreground">
        <div className="text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Failed to load</span>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={elementRef}
      className={`relative overflow-hidden ${className}`}
      style={containerStyles}
      onClick={onClick}
    >
      {/* Placeholder */}
      {showPlaceholder && !showError && (
        <div className="absolute inset-0">
          <Placeholder />
        </div>
      )}

      {/* Error State */}
      {showError && (
        <div className="absolute inset-0">
          <ErrorFallback />
        </div>
      )}

      {/* Actual Image */}
      {isInView && !showError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          sizes={sizes}
          className={`
            w-full h-full transition-opacity duration-300
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            ${objectFit === 'cover' ? 'object-cover' : 
              objectFit === 'contain' ? 'object-contain' : 
              objectFit === 'fill' ? 'object-fill' : 
              'object-scale-down'}
            ${onClick ? 'cursor-pointer' : ''}
            ${imgClassName}
          `}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? "eager" : "eager"}
          decoding="async"
        />
      )}
    </div>
  );
};

export default Image;