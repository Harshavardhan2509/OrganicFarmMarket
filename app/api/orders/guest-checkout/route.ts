import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// Generates a random order reference in a given numbering series (e.g. ORD-XXXXXX)
function generateOrderReference(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `ORD-${num}`
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, shippingAddress, items, stallName } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is mandatory for guest checkout' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is mandatory for guest checkout' }, { status: 400 })
    }
    if (!shippingAddress || !shippingAddress.trim()) {
      return NextResponse.json({ error: 'Delivery address is mandatory for guest checkout' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Guest cart is empty' }, { status: 400 })
    }

    const normalizedPhone = phone.trim()

    // 1. Find or create the Customer record
    const customer = await prisma.$transaction(async (tx) => {
      let userRecord = await tx.user.findUnique({
        where: { phone: normalizedPhone }
      })

      if (userRecord) {
        userRecord = await tx.user.update({
          where: { id: userRecord.id },
          data: {
            name: name.trim(),
            address: shippingAddress.trim()
          }
        })
      } else {
        userRecord = await tx.user.create({
          data: {
            name: name.trim(),
            phone: normalizedPhone,
            address: shippingAddress.trim(),
            role: 'customer'
          }
        })
        await tx.cart.create({
          data: { userId: userRecord.id }
        })
      }
      return userRecord
    })

    // 2. Process stock verification, updates, and order entries
    const resultOrder = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const itemsToCreate: Array<{ productId: string; quantity: number; price: number; unitSize: string | null }> = []
      const salesToCreate: Array<{ farmerId: string; amount: number }> = []

      // Generate unique order ID
      let orderId = generateOrderReference()
      let exists = await tx.order.findUnique({ where: { id: orderId } })
      while (exists) {
        orderId = generateOrderReference()
        exists = await tx.order.findUnique({ where: { id: orderId } })
      }

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        })

        if (!product) {
          throw new Error(`Product not found with ID: ${item.productId}`)
        }

        const quantityToDeduct = parseInt(item.quantity)
        const selectedUnitSizeName = item.unitSize || null
        let priceUsed = product.price

        if (product.unitSizes) {
          const sizes = JSON.parse(product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
          const sizeIndex = sizes.findIndex(s => s.size === selectedUnitSizeName)
          if (sizeIndex === -1) {
            throw new Error(`Unit size "${selectedUnitSizeName}" not found on product "${product.name}"`)
          }
          if (sizes[sizeIndex].quantity < quantityToDeduct) {
            throw new Error(`Insufficient stock for product "${product.name}" (${selectedUnitSizeName}). Available: ${sizes[sizeIndex].quantity}`)
          }

          // Deduct quantity
          sizes[sizeIndex].quantity -= quantityToDeduct
          priceUsed = sizes[sizeIndex].price

          const newUnitSizesStr = JSON.stringify(sizes)
          const newTotalQuantity = sizes.reduce((sum, s) => sum + s.quantity, 0)

          await tx.product.update({
            where: { id: product.id },
            data: {
              unitSizes: newUnitSizesStr,
              quantity: newTotalQuantity
            }
          })

          await tx.stockHistory.create({
            data: {
              productId: product.id,
              oldQuantity: product.quantity,
              newQuantity: newTotalQuantity,
              change: -quantityToDeduct,
              action: 'remove',
              reason: `Guest Marketplace Checkout [${selectedUnitSizeName}]`
            }
          })
        } else {
          if (product.quantity < quantityToDeduct) {
            throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.quantity}`)
          }

          const newQuantity = product.quantity - quantityToDeduct

          await tx.product.update({
            where: { id: product.id },
            data: { quantity: newQuantity }
          })

          await tx.stockHistory.create({
            data: {
              productId: product.id,
              oldQuantity: product.quantity,
              newQuantity,
              change: -quantityToDeduct,
              action: 'remove',
              reason: 'Guest Marketplace Checkout'
            }
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

      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          userId: customer.id,
          totalAmount,
          status: 'pending',
          paymentStatus: 'completed',
          shippingAddress: shippingAddress.trim(),
          orderType: 'pre-order',
          stallName: stallName || null,
          items: {
            create: itemsToCreate
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Create Sales records
      for (const sale of salesToCreate) {
        await tx.sale.create({
          data: {
            farmerId: sale.farmerId,
            orderId: newOrder.id,
            amount: sale.amount
          }
        })
      }

      // Create Billing Log
      await tx.billingLog.create({
        data: {
          orderId: newOrder.id,
          userId: customer.id,
          amount: totalAmount,
          status: 'completed',
          paymentMethod: 'UPI / Card (Guest)',
          transactionId: `GUEST-${Math.floor(10000000 + Math.random() * 90000000)}`
        }
      })

      return newOrder
    })

    return NextResponse.json(resultOrder, { status: 201 })
  } catch (error: any) {
    console.error('Guest checkout endpoint error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
