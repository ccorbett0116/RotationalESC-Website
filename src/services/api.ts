import axios from 'axios';
import { config } from '@/lib/config';

// Create axios instance with base URL
// In production, use the production domain API endpoint via nginx proxy
// In development, fall back to localhost or testing IP
const getBaseURL = () => {
  if (config.apiUrl) {
    return config.apiUrl;
  }
  
  // Development fallbacks
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }
  
  // Production fallback - use nginx proxy
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// CSRF token management
let csrfToken: string | null = null;

const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }
  
  try {
    await api.get('/csrf-token/');
    // Extract CSRF token from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        csrfToken = value;
        return csrfToken;
      }
    }
    throw new Error('CSRF token not found in cookies');
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    throw error;
  }
};

// Add request interceptor for debugging and CSRF token
api.interceptors.request.use(
  async (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    
    // Add CSRF token for POST, PUT, PATCH, DELETE requests
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      try {
        const token = await getCsrfToken();
        config.headers['X-CSRFToken'] = token;
      } catch (error) {
        console.warn('Could not get CSRF token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    
    // Enhance error object with network status info
    if (!error.response && error.request) {
      error.code = 'NETWORK_ERROR';
      error.message = 'Network Error - Backend unreachable';
    }
    
    return Promise.reject(error);
  }
);

// Types for API responses
export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  filename: string;
  content_type: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

export interface ProductSpecification {
  id: number;
  key: string;
  value: string;
  order: number;
}

export interface ProductAttachment {
  id: number;
  filename: string;
  content_type: string;
  file_size: number;
  file_size_human: string;
  description: string;
  order: number;
  is_public: boolean;
  is_image: boolean;
  is_pdf: boolean;
  is_document: boolean;
  data_url: string;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: number;
  label: string;
  page: string;
  created_at: string;
  updated_at: string;
}

export interface Manufacturer {
  id: number;
  label: string;
  url: string;
  image_url: string;
  filename: string;
  sections: Section[];
  created_at: string;
  updated_at: string;
}

export interface SectionWithManufacturers {
  id: number;
  label: string;
  page: string;
  manufacturers: Manufacturer[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  active: boolean;
  quantity: number;
  is_available: boolean;
  tags_list: string[] | null;
  primary_image?: string;
  images?: ProductImage[];
  specifications?: ProductSpecification[];
  attachments?: ProductAttachment[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;
  billing_address_line1: string;
  billing_address_line2?: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country?: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  order_items: OrderItem[];
}

export interface Order extends OrderData {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  stripe_payment_intent_id?: string;
  stripe_payment_intent_client_secret?: string;
  stripe_client_secret?: string; // For response from order creation
  confirmation_token?: string;
  confirmation_url?: string;
  items: Array<{
    id: number;
    product: Product;
    quantity: number;
    price: number;
    total_price: number;
  }>;
  created_at: string;
  updated_at: string;
  stripe_checkout_session_id?: string;
}

export interface OrderTotals {
  subtotal: number;
  tax_amount: number;
  total_amount: number;
}

// Gallery types
export interface GalleryImage {
  id: number;
  title: string;
  description: string;
  image_url: string;
  filename: string;
  content_type: string;
  alt_text: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// Company Info types
export interface CompanyInfo {
  id?: number;
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  days: string;
  founded: string;
  employees: string;
}

// API Service Functions
export const apiService = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories/');
    // Handle both paginated and non-paginated responses
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  // Products
  getProducts: async (params?: {
    search?: string;
    category?: string;
    category_name?: string;
    ordering?: string;
    page?: number;
  }): Promise<{ results: Product[]; count: number; next: string | null; previous: string | null }> => {
    const response = await api.get('/products/', { params });
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },

  searchProducts: async (query: string, category?: string): Promise<Product[]> => {
    const response = await api.get('/products/search/', {
      params: { q: query, category }
    });
    return response.data;
  },

  // Orders
  calculateOrderTotal: async (data: {
    items: Array<{ product_id: string; quantity: number }>;
    billing_country?: string;
  }): Promise<OrderTotals> => {
    const response = await api.post('/orders/calculate-total/', data);
    return response.data;
  },

  validateCart: async (data: {
    items: Array<{ product_id: string; quantity: number }>;
  }): Promise<{
    valid_cart_items: Array<{
      product_id: string;
      quantity: number;
      price: number;
      product_name: string;
    }>;
    removed_items: Array<{
      product_id: string;
      product_name: string;
      reason: string;
      message: string;
    }>;
    updated_items: Array<{
      product_id: string;
      product_name: string;
      original_quantity: number;
      adjusted_quantity: number;
      message: string;
    }>;
    cart_changed: boolean;
  }> => {
    const response = await api.post('/orders/validate-cart/', data);
    return response.data;
  },

  createOrder: async (orderData: OrderData): Promise<Order> => {
    const response = await api.post('/orders/', orderData);
    return response.data;
  },

  confirmPayment: async (orderNumber: string, paymentIntentId: string): Promise<Order> => {
    const response = await api.post(`/orders/${orderNumber}/confirm-payment/`, {
      payment_intent_id: paymentIntentId
    });
    return response.data;
  },

  createCheckoutSession: async (orderNumber: string, orderItems?: Array<{ name: string; price: number; quantity: number }>): Promise<{ checkout_session_id: string; url: string }> => {
    const response = await api.post(`/orders/${orderNumber}/create-checkout-session/`, orderItems ? { order_items: orderItems } : {});
    return response.data;
  },

  getOrder: async (orderNumber: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderNumber}/`);
    return response.data;
  },

  getOrderByToken: async (token: string): Promise<Order> => {
    const response = await api.get(`/orders/token/${token}/`);
    return response.data;
  },

  verifyCheckoutSession: async (sessionId: string, orderNumber: string): Promise<{ verified: boolean; order: Order }> => {
    const response = await api.post(`/orders/${orderNumber}/verify-checkout-session/`, {
      session_id: sessionId
    });
    return response.data;
  },

  notifyPaymentCancelled: async (orderNumber: string, reason: string): Promise<{ message: string }> => {
    const response = await api.post(`/orders/${orderNumber}/notify-payment-cancelled/`, {
      reason: reason
    });
    return response.data;
  },

  // Contact Form
  submitContactForm: async (contactData: ContactFormData): Promise<ContactSubmissionResponse> => {
    const response = await api.post('/contact/submit/', contactData);
    return response.data;
  },

  // Sections and Manufacturers
  getSections: async (): Promise<Section[]> => {
    const response = await api.get('/sections/');
    return response.data;
  },

  getManufacturers: async (sectionId?: number): Promise<Manufacturer[]> => {
    const params = sectionId ? { section: sectionId } : {};
    const response = await api.get('/manufacturers/', { params });
    return response.data;
  },

  getSectionsWithManufacturers: async (page?: string): Promise<SectionWithManufacturers[]> => {
    const params = page ? { page } : {};
    const response = await api.get('/sections-with-manufacturers/', { params });
    return response.data;
  },

  // Gallery
  getGalleryImages: async (): Promise<GalleryImage[]> => {
    const response = await api.get('/gallery/');
    return response.data;
  },

  getNewGalleryImages: async (): Promise<GalleryImage[]> => {
    const response = await api.get('/new-gallery/');
    return response.data;
  },

  // Company Info
  getCompanyInfo: async (): Promise<CompanyInfo> => {
    const response = await api.get('/company/info/');
    return response.data;
  },
};

// Contact form types
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
}

export interface ContactSubmissionResponse {
  message: string;
  submission_id: number;
  error?: string;
}

export default apiService;
