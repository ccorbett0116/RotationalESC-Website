import React, { useState, useRef, useEffect } from 'react';

interface TestImageProps {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}

const TestImage: React.FC<TestImageProps> = ({
  src,
  alt,
  className = '',
  lazy = true,
}) => {
  const [isInView, setIsInView] = useState(!lazy);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          console.log(`🔍 Image coming into view: ${src}`);
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView, src]);

  const handleImageLoad = () => {
    console.log(`✅ Image loaded: ${src}`);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.log(`❌ Image failed: ${src}`);
  };

  if (!isInView) {
    return (
      <div 
        ref={containerRef}
        className={`${className} bg-muted flex items-center justify-center`}
        style={{ minHeight: '200px' }}
      >
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-xs">Loading image...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="eager"
      />
    </div>
  );
};

export default TestImage;