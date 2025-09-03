import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface ProductImage {
  id: number;
  image: string;
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

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: Category;
  in_stock: boolean;
  material: string;
  tags_list: string[];
  primary_image?: string;
  images?: ProductImage[];
  specifications?: ProductSpecification[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: number;
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
  shipping_amount: number;
  total_amount: number;
  payment_method: string;
  shipping_method: string;
  order_items: OrderItem[];
}

export interface Order extends OrderData {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  tracking_number?: string;
  items: Array<{
    id: number;
    product: Product;
    quantity: number;
    price: number;
    total_price: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface OrderTotals {
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
}

// API Service Functions
export const apiService = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories/');
    return response.data;
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

  getProduct: async (id: number): Promise<Product> => {
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
    items: Array<{ product_id: number; quantity: number }>;
    shipping_method: string;
  }): Promise<OrderTotals> => {
    const response = await api.post('/orders/calculate-total/', data);
    return response.data;
  },

  createOrder: async (orderData: OrderData): Promise<Order> => {
    const response = await api.post('/orders/', orderData);
    return response.data;
  },

  getOrder: async (orderNumber: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderNumber}/`);
    return response.data;
  },

  // Contact Form
  submitContactForm: async (contactData: ContactFormData): Promise<ContactSubmissionResponse> => {
    const response = await api.post('/contact/submit/', contactData);
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
