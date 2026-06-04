// Basic types for the application
export type UserRole = 'customer' | 'farmer'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  address?: string
  profileImage?: string
  createdAt: Date
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  category: string
  image?: string
  farmerId: string
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  product?: Product
}

export interface Order {
  id: string
  userId: string
  totalAmount: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}
