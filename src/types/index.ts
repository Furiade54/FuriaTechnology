export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  specifications: Record<string, string>;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  icon?: string;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  isActive?: boolean;
  order?: number;
  style?: 'split' | 'cover';
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  isActive?: boolean;
  role?: 'user' | 'admin';
  mustChangePassword?: boolean;
}

export interface ProfileSection {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  route?: string;
}

export interface Order {
  id: string;
  userId: string;
  total: number;
  status: 'pending' | 'received' | 'processing' | 'on_hold' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'issue';
  createdAt: string;
  notes?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  productName?: string; // Helper for UI
  productImage?: string; // Helper for UI
}

export interface PaymentMethod {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  instructions?: string;
}

export interface StoreSetting {
  key: string;
  value: string;
  description?: string;
}
