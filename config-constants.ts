// config/constants.ts

export const APP_NAME = 'Organic Farm Marketplace';

// Role-based routes
export const CUSTOMER_ROUTES = {
  HOME: '/customer/dashboard',
  CART: '/customer/dashboard/cart',
  ORDERS: '/customer/dashboard/orders',
  BILLING: '/customer/dashboard/billing',
  PROFILE: '/customer/dashboard/profile',
};

export const FARMER_ROUTES = {
  HOME: '/farmer/dashboard',
  INVENTORY: '/farmer/dashboard/inventory',
  ORDERS: '/farmer/dashboard/orders',
  ANALYTICS: '/farmer/dashboard/analytics',
  PROFILE: '/farmer/dashboard/profile',
};

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/api/auth/logout',
};

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Payment statuses
export const PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
};

// Product categories
export const PRODUCT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Honey & Jams',
  'Herbs & Spices',
  'Other',
];

// Pagination
export const ITEMS_PER_PAGE = 10;

// Socket events
export const SOCKET_EVENTS = {
  ORDER_PLACED: 'order:placed',
  ORDER_STATUS_UPDATED: 'order:status-updated',
  BILLING_UPDATED: 'billing:updated',
  INVENTORY_UPDATED: 'inventory:updated',
  NOTIFICATION: 'notification',
};
