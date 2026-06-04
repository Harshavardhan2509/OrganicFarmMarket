// @ts-nocheck
// socket/index-example.ts
// Example Socket.io setup for real-time features

import { Server as HTTPServer } from 'http';
import { Socket as ClientSocket } from 'socket.io-client';
import { Server, Socket } from 'socket.io';

interface OrderPlacedEvent {
  orderId: string;
  customerId: string;
  farmerId: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface OrderStatusUpdateEvent {
  orderId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  message?: string;
}

interface BillingUpdateEvent {
  orderId: string;
  billingId: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed';
  amount: number;
}

export function initializeSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Store active connections
  const userSockets = new Map<string, string[]>();
  const farmerSockets = new Map<string, string[]>();

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // User joins their notification room
    socket.on('user:join', (userId: string) => {
      socket.join(`user:${userId}`);
      if (!userSockets.has(userId)) {
        userSockets.set(userId, []);
      }
      userSockets.get(userId)?.push(socket.id);
    });

    // Farmer joins their notification room
    socket.on('farmer:join', (farmerId: string) => {
      socket.join(`farmer:${farmerId}`);
      if (!farmerSockets.has(farmerId)) {
        farmerSockets.set(farmerId, []);
      }
      farmerSockets.get(farmerId)?.push(socket.id);
    });

    // When order is placed
    socket.on('order:placed', (data: OrderPlacedEvent) => {
      // Notify farmer
      io.to(`farmer:${data.farmerId}`).emit('order:placed', {
        orderId: data.orderId,
        customerId: data.customerId,
        totalAmount: data.totalAmount,
        items: data.items,
        timestamp: new Date().toISOString(),
      });
    });

    // When order status is updated
    socket.on('order:status-updated', (data: OrderStatusUpdateEvent) => {
      // Notify customer
      const orderId = data.orderId;
      io.emit('order:status-updated', data);
    });

    // When billing status updates (payment processing)
    socket.on('billing:updated', (data: BillingUpdateEvent) => {
      // Notify customer about payment status
      io.emit('billing:updated', data);
    });

    // When inventory is updated (stock changes)
    socket.on('inventory:updated', (data: any) => {
      io.emit('inventory:updated', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Clean up
      userSockets.forEach((sockets) => {
        const index = sockets.indexOf(socket.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
      });
      farmerSockets.forEach((sockets) => {
        const index = sockets.indexOf(socket.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
      });
    });
  });

  return io;
}

// Client-side hook example
export function useSocketConnection() {
  // This would be used in components with 'use client' directive
  // import io from 'socket.io-client';
  // 
  // useEffect(() => {
  //   const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
  //   
  //   socket.on('order:placed', (data) => {
  //     console.log('New order:', data);
  //   });
  //   
  //   socket.on('order:status-updated', (data) => {
  //     console.log('Order status updated:', data);
  //   });
  //   
  //   return () => socket.disconnect();
  // }, []);
}
