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
  added_to_cart?: boolean;
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
  private csrfToken: string | null = null;
  private csrfRefreshPromise: Promise<void> | null = null;

  constructor() {
    this.initializeTracking();
    this.refreshCsrfToken();
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
      // Use sync flush for beforeunload
      this.flushSync();
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

  private async refreshCsrfToken(): Promise<void> {
    // Prevent multiple simultaneous CSRF refresh requests
    if (this.csrfRefreshPromise) {
      return this.csrfRefreshPromise;
    }

    this.csrfRefreshPromise = this.fetchCsrfToken();
    try {
      await this.csrfRefreshPromise;
    } finally {
      this.csrfRefreshPromise = null;
    }
  }

  private async fetchCsrfToken(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf-token/`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
      } else {
        // If CSRF endpoint fails, try to get token from cookie
        this.csrfToken = this.getCsrfTokenFromCookie();
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
      // Fallback to cookie method
      this.csrfToken = this.getCsrfTokenFromCookie();
    }
  }

  private getCsrfTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private async sendRequest(endpoint: string, data: any, retryCount: number = 0): Promise<void> {
    if (!this.isTracking) return;

    // Create a cache key to prevent duplicate requests within a short time
    // Use more specific cache keys to avoid over-aggressive deduplication
    const cacheKey = `${endpoint}_${JSON.stringify(data)}_${Date.now() % 10000}`;
    const now = Date.now();
    const lastRequest = this.requestCache.get(cacheKey);
    
    // Reduce duplicate prevention time to 500ms (instead of 2 seconds) for better tracking
    if (lastRequest && (now - lastRequest) < 500) {
      return;
    }
    
    this.requestCache.set(cacheKey, now);

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      };

      // Add CSRF token if available
      if (this.csrfToken) {
        headers['X-CSRFToken'] = this.csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/analytics/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
        cache: 'no-store'
      });

      // Handle 403 errors by refreshing CSRF token and retrying
      if (response.status === 403 && retryCount < 2) {
        console.warn(`Analytics 403 error, refreshing session and retrying (attempt ${retryCount + 1})`);
        
        // Clear any stale session data and refresh CSRF token
        await this.handleSessionRefresh();
        
        // Retry the request
        return this.sendRequest(endpoint, data, retryCount + 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.warn('Analytics tracking failed:', error);
      
      // Only retry on network errors or 403s, not on other HTTP errors
      if (retryCount < 1 && (error instanceof TypeError || error.message.includes('403'))) {
        console.warn('Retrying analytics request after error');
        await this.handleSessionRefresh();
        return this.sendRequest(endpoint, data, retryCount + 1);
      }
      
      // Queue for later retry if this is an important event
      if (this.isImportantEvent(endpoint)) {
        this.pendingEvents.push({ endpoint, data });
      }
    }
  }

  private async handleSessionRefresh(): Promise<void> {
    try {
      // Clear existing CSRF token
      this.csrfToken = null;
      
      // Wait a bit to avoid rapid retries
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh CSRF token
      await this.refreshCsrfToken();
      
      // Also try to refresh the session by making a simple request
      await fetch(`${API_BASE_URL}/csrf-token/`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      
    } catch (error) {
      console.warn('Session refresh failed:', error);
    }
  }

  private isImportantEvent(endpoint: string): boolean {
    // Consider product views, searches, and cart actions as important
    return endpoint.includes('product') || endpoint.includes('search') || endpoint.includes('cart');
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
  private async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const eventsToRetry = [...this.pendingEvents];
    this.pendingEvents = [];

    console.log(`Flushing ${eventsToRetry.length} pending analytics events...`);

    // Process events with a small delay to avoid overwhelming the server
    for (const { endpoint, data } of eventsToRetry) {
      try {
        await this.sendRequest(endpoint, data);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.warn('Failed to flush analytics event:', error);
      }
    }
  }

  // Synchronous flush for beforeunload events
  private flushSync(): void {
    if (this.pendingEvents.length === 0) return;

    const eventsToRetry = [...this.pendingEvents];
    this.pendingEvents = [];

    // Use sendBeacon for reliable delivery on page unload
    eventsToRetry.forEach(({ endpoint, data }) => {
      try {
        const url = `${API_BASE_URL}/analytics/${endpoint}`;
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob);
        } else {
          // Fallback to sync XHR (not ideal but works)
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url, false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          if (this.csrfToken) {
            xhr.setRequestHeader('X-CSRFToken', this.csrfToken);
          }
          xhr.withCredentials = true;
          xhr.send(JSON.stringify(data));
        }
      } catch (error) {
        console.warn('Failed to flush analytics event synchronously:', error);
      }
    });
  }

  // Enable/disable tracking
  public setTracking(enabled: boolean): void {
    this.isTracking = enabled;
  }

  // Manually refresh session and CSRF token (useful for debugging or after deployment)
  public async refreshSession(): Promise<void> {
    console.log('Manually refreshing analytics session...');
    await this.handleSessionRefresh();
    console.log('Analytics session refreshed');
  }

  // Clean up
  public async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
    this.requestCache.clear();
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Expose refresh method globally for debugging
if (typeof window !== 'undefined') {
  (window as any).refreshAnalyticsSession = () => analyticsService.refreshSession();
}

export default analyticsService;