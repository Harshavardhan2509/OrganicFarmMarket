// @ts-nocheck
// lib/db-example.ts
// This is an example of how to setup Prisma client

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Example database operations

// Get user by email
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

// Get all products for a farmer
export async function getFarmerProducts(farmerId: string) {
  return prisma.product.findMany({
    where: { farmerId },
    orderBy: { createdAt: 'desc' },
  });
}

// Create order with items
export async function createOrder(userId: string, items: any[], totalAmount: number) {
  return prisma.order.create({
    data: {
      userId,
      totalAmount,
      items: {
        create: items,
      },
    },
    include: {
      items: true,
    },
  });
}

// Get user orders
export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          // Can populate product details if needed
        },
      },
      billingLogs: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

// Get sales analytics for farmer
export async function getFarmerSalesAnalytics(farmerId: string, startDate: Date, endDate: Date) {
  return prisma.sales.findMany({
    where: {
      farmerId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

// Add to cart
export async function addToCart(userId: string, productId: string, quantity: number) {
  const cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart) {
    return prisma.cartItem.create({
      data: {
        cart: {
          create: {
            userId,
          },
        },
        productId,
        quantity,
      },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
    },
  });
}
