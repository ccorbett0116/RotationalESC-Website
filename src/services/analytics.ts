// Analytics tracking service for the React frontend
// Get API base URL
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface AnalyticsEvent {
  event_type: 'click' | 'scroll' | 'download' | 'form_submit' | 'video_play' | 
             'image_view' | 'contact_form' | 'quote_request' | 'phone_click' | 
             'email_click' | 'external_link' | 'cart_add' | 'cart_remove';
  element_id?: string;
  element_class?: string;
  element_text?: string;
  page_path: string;
  product_id?: string;
  metadata?: Record<string, any>;
}

export interface ProductViewData {
  product_id: string;
  viewed_images?: string[];
  viewed_attachments?: string[];
  time_on_page?: number;
  scroll_depth?: number;
}

export interface SearchData {
  query: string;
  results_count: number;
}

export interface PageMetrics {
  page_path: string;
  scroll_depth?: number;
  time_on_page?: number;
  load_time?: number;
}

class AnalyticsService {
  private startTime: number = Date.now();
  private maxScrollDepth: number = 0;
  private isTracking: boolean = true;
  private pendingEvents: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private requestCache: Map<string, number> = new Map();

  constructor() {
    this.initializeTracking();
  }

  private initializeTracking() {
    // Track page load time
    window.addEventListener('load', () => {
      const loadTime = Date.now() - this.startTime;
      this.updatePageMetrics({
        page_path: window.location.pathname,
        load_time: loadTime
      });
    });

    // Track scroll depth (for non-product pages)
    let scrollTimer: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollDepth = this.calculateScrollDepth();
        if (scrollDepth > this.maxScrollDepth) {
          this.maxScrollDepth = scrollDepth;
          // Only track page metrics for non-product pages
          if (!window.location.pathname.includes('/product/')) {
            this.updatePageMetrics({
              page_path: window.location.pathname,
              scroll_depth: scrollDepth
            });
          }
        }
      }, 250);
    });

    // Track time on page before leaving (for non-product pages)
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.floor((Date.now() - this.startTime) / 1000);
      // Only track page metrics for non-product pages
      if (!window.location.pathname.includes('/product/')) {
        this.updatePageMetrics({
          page_path: window.location.pathname,
          time_on_page: timeOnPage,
          scroll_depth: this.maxScrollDepth
        });
      }
      this.flush();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        const timeOnPage = Math.floor((Date.now() - this.startTime) / 1000);
        this.updatePageMetrics({
          page_path: window.location.pathname,
          time_on_page: timeOnPage,
          scroll_depth: this.maxScrollDepth
        });
      } else {
        this.startTime = Date.now();
        this.maxScrollDepth = this.calculateScrollDepth();
      }
    });

    // Auto-flush pending events every 10 seconds
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 10000);
  }

  private calculateScrollDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const winHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollPercent = (scrollTop + winHeight) / docHeight * 100;
    return Math.min(Math.round(scrollPercent), 100);
  }

  private async sendRequest(endpoint: string, data: any): Promise<void> {
    if (!this.isTracking) return;

    // Create a cache key to prevent duplicate requests within a short time
    const cacheKey = `${endpoint}_${JSON.stringify(data)}`;
    const now = Date.now();
    const lastRequest = this.requestCache.get(cacheKey);
    
    // If the same request was made within the last 2 seconds, skip it
    if (lastRequest && (now - lastRequest) < 2000) {
      return;
    }
    
    this.requestCache.set(cacheKey, now);

    try {
      await fetch(`${API_BASE_URL}/analytics/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
      // Optionally queue for retry
      this.pendingEvents.push({ endpoint, data });
    }
  }

  public async trackProductView(data: ProductViewData): Promise<void> {
    await this.sendRequest('track/product/', data);
  }

  public async trackSearch(data: SearchData): Promise<void> {
    await this.sendRequest('track/search/', data);
  }

  public async trackEvent(event: AnalyticsEvent): Promise<void> {
    await this.sendRequest('track/event/', event);
  }

  public async updatePageMetrics(metrics: PageMetrics): Promise<void> {
    await this.sendRequest('track/page/', metrics);
  }

  public async trackClick(element: HTMLElement, additionalData?: Record<string, any>): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'click',
      element_id: element.id || undefined,
      element_class: element.className || undefined,
      element_text: element.textContent?.slice(0, 200) || undefined,
      page_path: window.location.pathname,
      metadata: additionalData
    };

    await this.trackEvent(event);
  }

  public async trackDownload(filename: string, url: string): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'download',
      element_text: filename,
      page_path: window.location.pathname,
      metadata: { url, filename }
    };

    await this.trackEvent(event);
  }

  public async trackExternalLink(url: string, text?: string): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'external_link',
      element_text: text,
      page_path: window.location.pathname,
      metadata: { url }
    };

    await this.trackEvent(event);
  }

  public async trackFormSubmit(formName: string, success: boolean = true): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'form_submit',
      element_text: formName,
      page_path: window.location.pathname,
      metadata: { success }
    };

    await this.trackEvent(event);
  }

  public async trackCartAdd(productId: string, productName: string): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'cart_add',
      element_text: productName,
      page_path: window.location.pathname,
      product_id: productId,
      metadata: { productName }
    };

    await this.trackEvent(event);
    
    // Also update the ProductView record to mark as added to cart
    await this.trackProductView({
      product_id: productId,
      added_to_cart: true
    });
  }

  public async trackCartRemove(productId: string, productName: string): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'cart_remove',
      element_text: productName,
      page_path: window.location.pathname,
      product_id: productId,
      metadata: { productName }
    };

    await this.trackEvent(event);
  }

  public async trackPhoneClick(phoneNumber: string): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'phone_click',
      element_text: phoneNumber,
      page_path: window.location.pathname,
      metadata: { phoneNumber }
    };

    await this.trackEvent(event);
  }

  public async trackEmailClick(email: string): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'email_click',
      element_text: email,
      page_path: window.location.pathname,
      metadata: { email }
    };

    await this.trackEvent(event);
  }

  public async trackImageView(imageId: string, productId?: string): Promise<void> {
    const event: AnalyticsEvent = {
      event_type: 'image_view',
      page_path: window.location.pathname,
      product_id: productId,
      metadata: { imageId }
    };

    await this.trackEvent(event);
  }

  // Get popular products
  public async getPopularProducts(limit: number = 10, timeframe: 'week' | 'month' | 'all' = 'all') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/popular-products/?limit=${limit}&timeframe=${timeframe}`,
        {
          credentials: 'include'
        }
      );
      const data = await response.json();
      return data.popular_products || [];
    } catch (error) {
      console.error('Failed to fetch popular products:', error);
      return [];
    }
  }

  // Get analytics dashboard data
  public async getDashboardData(timeframe: 'day' | 'week' | 'month' = 'week') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/dashboard/?timeframe=${timeframe}`,
        {
          credentials: 'include'
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      return null;
    }
  }

  // Flush any pending events
  private flush(): void {
    if (this.pendingEvents.length === 0) return;

    const eventsToRetry = [...this.pendingEvents];
    this.pendingEvents = [];

    eventsToRetry.forEach(({ endpoint, data }) => {
      this.sendRequest(endpoint, data);
    });
  }

  // Enable/disable tracking
  public setTracking(enabled: boolean): void {
    this.isTracking = enabled;
  }

  // Clean up
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
    this.requestCache.clear();
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;