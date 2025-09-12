import { useEffect, useCallback, useRef } from 'react';
import analyticsService, { ProductViewData, SearchData } from '../services/analytics';

export const useAnalytics = () => {
  const productViewTimeRef = useRef<number>(0);
  const productViewScrollRef = useRef<number>(0);

  // Track product view with timing
  const trackProductView = useCallback((productId: string, additionalData?: Partial<ProductViewData>) => {
    productViewTimeRef.current = Date.now();
    productViewScrollRef.current = 0;
    
    const data: ProductViewData = {
      product_id: productId,
      ...additionalData
    };
    
    analyticsService.trackProductView(data);
  }, []);

  // Track product view end (when leaving product page)
  const trackProductViewEnd = useCallback((productId: string, additionalData?: Partial<ProductViewData>) => {
    if (productViewTimeRef.current > 0) {
      const timeOnPage = Math.floor((Date.now() - productViewTimeRef.current) / 1000);
      const data: ProductViewData = {
        product_id: productId,
        time_on_page: timeOnPage,
        scroll_depth: productViewScrollRef.current,
        ...additionalData
      };
      
      analyticsService.trackProductView(data);
    }
  }, []);

  // Track search
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    const data: SearchData = {
      query,
      results_count: resultsCount
    };
    
    analyticsService.trackSearch(data);
  }, []);

  // Track click events
  const trackClick = useCallback((element: HTMLElement, additionalData?: Record<string, any>) => {
    analyticsService.trackClick(element, additionalData);
  }, []);

  // Track form submissions
  const trackFormSubmit = useCallback((formName: string, success: boolean = true) => {
    analyticsService.trackFormSubmit(formName, success);
  }, []);

  // Track downloads
  const trackDownload = useCallback((filename: string, url: string) => {
    analyticsService.trackDownload(filename, url);
  }, []);

  // Track cart actions
  const trackCartAdd = useCallback((productId: string, productName: string) => {
    analyticsService.trackCartAdd(productId, productName);
  }, []);

  const trackCartRemove = useCallback((productId: string, productName: string) => {
    analyticsService.trackCartRemove(productId, productName);
  }, []);

  // Track contact actions
  const trackPhoneClick = useCallback((phoneNumber: string) => {
    analyticsService.trackPhoneClick(phoneNumber);
  }, []);

  const trackEmailClick = useCallback((email: string) => {
    analyticsService.trackEmailClick(email);
  }, []);

  // Track external links
  const trackExternalLink = useCallback((url: string, text?: string) => {
    analyticsService.trackExternalLink(url, text);
  }, []);

  // Track image views
  const trackImageView = useCallback((imageId: string, productId?: string) => {
    analyticsService.trackImageView(imageId, productId);
  }, []);

  return {
    trackProductView,
    trackProductViewEnd,
    trackSearch,
    trackClick,
    trackFormSubmit,
    trackDownload,
    trackCartAdd,
    trackCartRemove,
    trackPhoneClick,
    trackEmailClick,
    trackExternalLink,
    trackImageView,
  };
};

// Hook specifically for product pages
export const useProductAnalytics = (productId: string, productName: string) => {
  const analytics = useAnalytics();
  const startTimeRef = useRef<number>(0);
  const viewedImagesRef = useRef<Set<string>>(new Set());
  const viewedAttachmentsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Track product view when component mounts
    startTimeRef.current = Date.now();
    analytics.trackProductView(productId);

    // Track when leaving the product page
    return () => {
      if (startTimeRef.current > 0) {
        const timeOnPage = Math.floor((Date.now() - startTimeRef.current) / 1000);
        analyticsService.trackProductView({
          product_id: productId,
          time_on_page: timeOnPage,
          viewed_images: Array.from(viewedImagesRef.current),
          viewed_attachments: Array.from(viewedAttachmentsRef.current)
        });
      }
    };
  }, [productId, analytics]);

  const trackImageView = useCallback((imageId: string) => {
    viewedImagesRef.current.add(imageId);
    analytics.trackImageView(imageId, productId);
  }, [productId, analytics]);

  const trackAttachmentView = useCallback((attachmentId: string) => {
    viewedAttachmentsRef.current.add(attachmentId);
  }, []);

  const trackAddToCart = useCallback(() => {
    analytics.trackCartAdd(productId, productName);
  }, [productId, productName, analytics]);

  return {
    trackImageView,
    trackAttachmentView,
    trackAddToCart,
  };
};

// Hook for search pages
export const useSearchAnalytics = () => {
  const { trackSearch } = useAnalytics();

  const trackSearchQuery = useCallback((query: string, results: any[]) => {
    trackSearch(query, results.length);
  }, [trackSearch]);

  return {
    trackSearchQuery,
  };
};