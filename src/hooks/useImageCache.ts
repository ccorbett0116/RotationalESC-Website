import { useState, useEffect, useCallback } from 'react';

interface CachedImage {
  url: string;
  timestamp: number;
  blob?: Blob;
}

class ImageCacheManager {
  private cache = new Map<string, CachedImage>();
  private maxSize = 50; // Maximum number of cached images
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes
  private pendingRequests = new Map<string, Promise<string>>();

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
        if (value.url.startsWith('blob:')) {
          URL.revokeObjectURL(value.url);
        }
      }
    });

    // If still over limit, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const sorted = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sorted.slice(0, this.cache.size - this.maxSize);
      toRemove.forEach(([key, value]) => {
        this.cache.delete(key);
        if (value.url.startsWith('blob:')) {
          URL.revokeObjectURL(value.url);
        }
      });
    }
  }

  async getImage(imageId: string, originalUrl: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(imageId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.url;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(imageId)) {
      return this.pendingRequests.get(imageId)!;
    }

    // Create new request
    const requestPromise = this.fetchAndCacheImage(imageId, originalUrl);
    this.pendingRequests.set(imageId, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(imageId);
    }
  }

  private async fetchAndCacheImage(imageId: string, originalUrl: string): Promise<string> {
    try {
      // For base64 data URLs, cache them directly
      if (originalUrl.startsWith('data:')) {
        const cached: CachedImage = {
          url: originalUrl,
          timestamp: Date.now()
        };
        this.cache.set(imageId, cached);
        this.cleanup();
        return originalUrl;
      }

      // For regular URLs, fetch and create blob URL
      const response = await fetch(originalUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const cached: CachedImage = {
        url: blobUrl,
        timestamp: Date.now(),
        blob
      };

      this.cache.set(imageId, cached);
      this.cleanup();
      return blobUrl;
    } catch (error) {
      console.warn(`Failed to cache image ${imageId}:`, error);
      return originalUrl; // Fallback to original URL
    }
  }

  preloadImages(images: Array<{ id: string; url: string }>) {
    // Preload images in the background
    images.forEach(({ id, url }) => {
      if (!this.cache.has(id) && !this.pendingRequests.has(id)) {
        this.getImage(id, url).catch(() => {
          // Ignore preload errors
        });
      }
    });
  }

  clearCache() {
    this.cache.forEach((value) => {
      if (value.url.startsWith('blob:')) {
        URL.revokeObjectURL(value.url);
      }
    });
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

const imageCacheManager = new ImageCacheManager();

export const useImageCache = (imageId: string, originalUrl: string) => {
  const [cachedUrl, setCachedUrl] = useState<string>(originalUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadImage = useCallback(async () => {
    if (!originalUrl || !imageId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const url = await imageCacheManager.getImage(imageId, originalUrl);
      setCachedUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setCachedUrl(originalUrl); // Fallback
    } finally {
      setLoading(false);
    }
  }, [imageId, originalUrl]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return { cachedUrl, loading, error };
};

export const useImagePreloader = () => {
  const preloadImages = useCallback((images: Array<{ id: string; url: string }>) => {
    imageCacheManager.preloadImages(images);
  }, []);

  const clearCache = useCallback(() => {
    imageCacheManager.clearCache();
  }, []);

  return { preloadImages, clearCache };
};

export default imageCacheManager;