export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id) {
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
    } else if (userRole === 'salesperson') {
      // Return all orders for salespeople in the stall/live counter context
      const orders = await prisma.order.findMany({
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
      return NextResponse.json(orders)
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

function generateOrderReference(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `ORD-${num}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { shippingAddress, phone, stallName } = await request.json()

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
    const itemsToCreate: Array<{ productId: string; quantity: number; price: number; unitSize: string | null }> = []
    const stockUpdates: Array<{ productId: string; unitSizes: string | null; quantity: number }> = []
    const salesToCreate: Array<{ farmerId: string; amount: number }> = []

    for (const item of cart.items) {
      const product = item.product
      const quantityToDeduct = item.quantity
      const selectedUnitSizeName = item.unitSize || null
      let priceUsed = product.price

      if (product.unitSizes) {
        const sizes = JSON.parse(product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
        const sizeIndex = sizes.findIndex(s => s.size === selectedUnitSizeName)
        if (sizeIndex === -1) {
          return NextResponse.json({ error: `Unit size "${selectedUnitSizeName}" not found on product "${product.name}"` }, { status: 400 })
        }
        if (sizes[sizeIndex].quantity < quantityToDeduct) {
          return NextResponse.json({ error: `Insufficient stock for product "${product.name}" (${selectedUnitSizeName}). Available: ${sizes[sizeIndex].quantity}` }, { status: 400 })
        }

        // Deduct from unit size quantity
        sizes[sizeIndex].quantity -= quantityToDeduct
        priceUsed = sizes[sizeIndex].price

        const newUnitSizesStr = JSON.stringify(sizes)
        const newTotalQuantity = sizes.reduce((sum, s) => sum + s.quantity, 0)

        stockUpdates.push({
          productId: product.id,
          unitSizes: newUnitSizesStr,
          quantity: newTotalQuantity
        })
      } else {
        if (product.quantity < quantityToDeduct) {
          return NextResponse.json({ error: `Insufficient stock for product "${product.name}". Available: ${product.quantity}` }, { status: 400 })
        }

        stockUpdates.push({
          productId: product.id,
          unitSizes: null,
          quantity: product.quantity - quantityToDeduct
        })
      }

      const itemTotal = priceUsed * quantityToDeduct
      totalAmount += itemTotal

      itemsToCreate.push({
        productId: product.id,
        quantity: quantityToDeduct,
        price: priceUsed,
        unitSize: selectedUnitSizeName
      })

      salesToCreate.push({
        farmerId: product.farmerId,
        amount: itemTotal
      })
    }

    // 3. Execute database operations in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Generate order ID
      let orderId = generateOrderReference()
      let exists = await tx.order.findUnique({ where: { id: orderId } })
      while (exists) {
        orderId = generateOrderReference()
        exists = await tx.order.findUnique({ where: { id: orderId } })
      }

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
          id: orderId,
          userId,
          totalAmount,
          status: 'pending',
          paymentStatus: 'completed', // Mock complete payment directly upon checkout
          shippingAddress: shippingAddress || 'Default Address',
          stallName: stallName || null,
          items: {
            create: itemsToCreate
          }
        },
        include: {
          items: true
        }
      })

      // b. Update stock levels for each product and log history
      for (const update of stockUpdates) {
        const originalProduct = await tx.product.findUnique({ where: { id: update.productId } })
        if (originalProduct) {
          await tx.product.update({
            where: { id: update.productId },
            data: {
              unitSizes: update.unitSizes,
              quantity: update.quantity
            }
          })

          const changeQty = update.quantity - originalProduct.quantity
          const unitLabel = itemsToCreate.find(i => i.productId === update.productId)?.unitSize
          await tx.stockHistory.create({
            data: {
              productId: update.productId,
              oldQuantity: originalProduct.quantity,
              newQuantity: update.quantity,
              change: changeQty,
              action: 'remove',
              reason: `Marketplace Order Checkout [${unitLabel || 'Standard'}]`
            }
          })
        }
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
