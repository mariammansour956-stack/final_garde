export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type NotificationType =
  | "order_created"
  | "order_shipped"
  | "order_delivered"
  | "account_update";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: "customer" | "admin";
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  username?: string;
}

export interface OrderCreateRequest {
  items: {
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
  }[];
  shipping_address: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
}

export interface UnreadCount {
  count: number;
}

export interface OrderStats {
  status: string;
  count: number;
  total_revenue: number;
}
