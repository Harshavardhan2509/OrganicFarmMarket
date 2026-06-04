export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole === 'farmer') {
      // Return orders containing products owned by this farmer
      const orders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              product: {
                farmerId: userId
              }
            }
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Map orders to only show items belonging to this farmer to avoid exposing other farmers' items
      const customizedOrders = orders.map(order => {
        const farmerItems = order.items.filter(item => item.product.farmerId === userId)
        const farmerTotal = farmerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        return {
          ...order,
          items: farmerItems,
          totalAmount: farmerTotal // Adjusted total showing only this farmer's share
        }
      })

      return NextResponse.json(customizedOrders)
    } else {
      // Customer: Return all orders placed by them
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  farmer: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          billingLogs: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(orders)
    }
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { shippingAddress, phone } = await request.json()

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is mandatory' }, { status: 400 })
    }

    // 1. Get customer cart and items
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Your shopping cart is empty' }, { status: 400 })
    }

    // 2. Validate stock and compute totals
    let totalAmount = 0
    const itemsToCreate: Array<{ productId: string; quantity: number; price: number }> = []
    const stockUpdates: Array<{ productId: string; newQuantity: number }> = []
    const salesToCreate: Array<{ farmerId: string; amount: number }> = []

    for (const item of cart.items) {
      const product = item.product
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}. Available: ${product.quantity}` },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      itemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      })

      stockUpdates.push({
        productId: product.id,
        newQuantity: product.quantity - item.quantity
      })

      salesToCreate.push({
        farmerId: product.farmerId,
        amount: itemTotal
      })
    }

    // 3. Execute database operations in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Update customer contact details in the profile permanently
      await tx.user.update({
        where: { id: userId },
        data: {
          phone: phone.trim(),
          address: shippingAddress ? shippingAddress.trim() : undefined
        }
      })

      // a. Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'pending',
          paymentStatus: 'completed', // Mock complete payment directly upon checkout
          shippingAddress: shippingAddress || 'Default Address',
          items: {
            create: itemsToCreate
          }
        },
        include: {
          items: true
        }
      })

      // b. Update stock levels for each product
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.productId },
          data: { quantity: update.newQuantity }
        })
      }

      // c. Create Sales records for farmers
      for (const sale of salesToCreate) {
        await tx.sale.create({
          data: {
            farmerId: sale.farmerId,
            orderId: newOrder.id,
            amount: sale.amount
          }
        })
      }

      // d. Create Billing Log
      await tx.billingLog.create({
        data: {
          orderId: newOrder.id,
          userId,
          amount: totalAmount,
          status: 'completed',
          paymentMethod: 'Credit Card',
          transactionId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`
        }
      })

      // e. Empty customer's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      })

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
