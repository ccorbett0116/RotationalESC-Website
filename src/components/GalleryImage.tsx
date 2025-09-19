import React from 'react';
import Image from './Image';

interface GalleryImageProps {
  imageId: number;
  type?: 'service' | 'new-equipment';
  src?: string; // fallback URL
  alt: string;
  className?: string;
  imgClassName?: string;
  lazy?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  errorFallback?: React.ReactNode;
}

/**
 * GalleryImage component handles backend URL generation for gallery images
 * and provides a consistent interface for all gallery-related images
 */
const GalleryImage: React.FC<GalleryImageProps> = ({
  imageId,
  type = 'service',
  src,
  alt,
  ...imageProps
}) => {
  // Generate the proper backend URL for gallery images
  const getImageUrl = (): string => {
    // If explicit src is provided, use it (for backwards compatibility)
    if (src) {
      // If it's already a full URL or data URL, use as-is
      if (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:')) {
        return src;
      }
      // Otherwise assume it's a relative path and make it absolute
      return `/${src}`;
    }

    // Generate backend API URL based on gallery type
    if (type === 'new-equipment') {
      return `/api/new-gallery/${imageId}/image/`;
    } else {
      return `/api/gallery/${imageId}/image/`;
    }
  };

  const imageUrl = getImageUrl();
  
  return (
    <Image
      src={imageUrl}
      alt={alt}
      {...imageProps}
    />
  );
};

export default GalleryImage;