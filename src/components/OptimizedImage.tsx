import React, { useState, useRef, useEffect } from 'react';
import { useImageCache } from '@/hooks/useImageCache';

interface OptimizedImageProps {
  id: string;
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  id,
  src,
  alt,
  className = '',
  placeholder,
  lazy = true,
  onLoad,
  onError
}) => {
  const [isInView, setIsInView] = useState(!lazy);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { cachedUrl, loading, error } = useImageCache(id, src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Handle image load events
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    onError?.(error || 'Failed to load image');
  };

  // Show placeholder while not in view or loading
  if (!isInView) {
    return (
      <div 
        ref={imgRef}
        className={`${className} bg-muted flex items-center justify-center`}
        style={{ minHeight: '200px' }}
      >
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show error state
  if (imageError || error) {
    return (
      <div 
        className={`${className} bg-muted flex items-center justify-center text-muted-foreground`}
        style={{ minHeight: '200px' }}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  // Show loading state while image cache is loading
  if (loading) {
    return (
      <div 
        className={`${className} bg-muted flex items-center justify-center`}
        style={{ minHeight: '200px' }}
      >
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        ref={imgRef}
        src={cachedUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

export default OptimizedImage;