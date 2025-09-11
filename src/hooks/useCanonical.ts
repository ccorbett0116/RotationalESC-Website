import { useEffect } from 'react';

export const useCanonical = (path: string) => {
  useEffect(() => {
    // Remove existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Create new canonical link
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = `https://rotationales.com${path}`;
    document.head.appendChild(canonical);

    // Cleanup function
    return () => {
      const linkToRemove = document.querySelector('link[rel="canonical"]');
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [path]);
};