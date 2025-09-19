import React from 'react';
import Image from './Image';

interface ProductImageProps {
  productId?: string;
  imageId?: number;
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
 * ProductImage component handles backend URL generation for product images
 * and provides a consistent interface for all product-related images
 */
const ProductImage: React.FC<ProductImageProps> = ({
  productId,
  imageId,
  src,
  alt,
  ...imageProps
}) => {
  // Generate the proper backend URL for product images
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

    // Generate backend API URL
    if (productId && imageId !== undefined) {
      return `/api/products/${productId}/image/${imageId}/`;
    }

    // Fallback - this shouldn't happen in normal usage
    throw new Error('ProductImage requires either src or both productId and imageId');
  };

  try {
    const imageUrl = getImageUrl();
    
    return (
      <Image
        src={imageUrl}
        alt={alt}
        {...imageProps}
      />
    );
  } catch (error) {
    // Show error state if URL generation fails
    return (
      <div className={`bg-muted flex items-center justify-center text-muted-foreground ${imageProps.className || ''}`}>
        <div className="text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-xs">Invalid image configuration</span>
        </div>
      </div>
    );
  }
};

export default ProductImage;