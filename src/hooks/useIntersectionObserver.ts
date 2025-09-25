import { useEffect, useRef, useState } from 'react';

// Singleton intersection observer to avoid creating multiple observers
class IntersectionObserverManager {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, () => void>();

  private getObserver(): IntersectionObserver {
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const callback = this.callbacks.get(entry.target);
              if (callback) {
                callback();
                this.unobserve(entry.target);
              }
            }
          });
        },
        {
          rootMargin: '5px',
          threshold: 0.1
        }
      );
    }
    return this.observer;
  }

  observe(element: Element, callback: () => void) {
    this.callbacks.set(element, callback);
    this.getObserver().observe(element);
  }

  unobserve(element: Element) {
    this.callbacks.delete(element);
    this.getObserver().unobserve(element);
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.callbacks.clear();
      this.observer = null;
    }
  }
}

const intersectionManager = new IntersectionObserverManager();

export const useIntersectionObserver = (
  enabled: boolean = true,
  priority: boolean = false
) => {
  const [isInView, setIsInView] = useState(!enabled || priority);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If not enabled or priority is true, immediately set to in view
    if (!enabled || priority) {
      setIsInView(true);
      return;
    }
    
    if (isInView) return;

    const element = elementRef.current;
    if (!element) return;

    const callback = () => setIsInView(true);
    intersectionManager.observe(element, callback);

    return () => {
      intersectionManager.unobserve(element);
    };
  }, [enabled, isInView, priority]);

  return { isInView, elementRef };
};

export default useIntersectionObserver;