import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// Generates a random order reference in a given numbering series (e.g. ORD-XXXXXX)
function generateOrderReference(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `ORD-${num}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['farmer', 'salesperson'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customerName, customerPhone, customerAddress, stallPlace, cart } = await request.json()

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: 'Customer Name is mandatory' }, { status: 400 })
    }
    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json({ error: 'Customer Mobile Number is mandatory' }, { status: 400 })
    }
    if (!customerAddress || !customerAddress.trim()) {
      return NextResponse.json({ error: 'Customer Address is mandatory' }, { status: 400 })
    }
    if (!stallPlace || !stallPlace.trim()) {
      return NextResponse.json({ error: 'Stall place of counter is mandatory' }, { status: 400 })
    }
    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const normalizedPhone = customerPhone.trim()

    // 1. Create or merge Customer record (User with role customer)
    const customer = await prisma.$transaction(async (tx) => {
      let userRecord = await tx.user.findUnique({
        where: { phone: normalizedPhone }
      })

      if (userRecord) {
        // Merge name and address
        userRecord = await tx.user.update({
          where: { id: userRecord.id },
          data: {
            name: customerName.trim(),
            address: customerAddress.trim()
          }
        })
      } else {
        // Create new customer
        userRecord = await tx.user.create({
          data: {
            name: customerName.trim(),
            phone: normalizedPhone,
            address: customerAddress.trim(),
            role: 'customer'
          }
        })
        // Initialize an empty cart for this new customer
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

      // Generate order ID
      let orderId = generateOrderReference()
      // Ensure uniqueness
      let exists = await tx.order.findUnique({ where: { id: orderId } })
      while (exists) {
        orderId = generateOrderReference()
        exists = await tx.order.findUnique({ where: { id: orderId } })
      }

      const categories = await tx.category.findMany()

      for (const item of cart) {
        const product = await tx.product.findUnique({
          where: { id: item.product.id }
        })

        if (!product) {
          throw new Error(`Product not found: ${item.product.name}`)
        }

        const cat = categories.find(c => c.name === product.category)
        const cgst = cat ? cat.cgst : 0
        const sgst = cat ? cat.sgst : 0
        const totalGstRate = cgst + sgst

        const quantityToDeduct = parseInt(item.quantity)
        const selectedUnitSizeName = item.unitSize || null
        let priceUsed = Math.round(product.price * (1 + totalGstRate / 100))

        if (product.unitSizes) {
          // Product has multiple unit sizes
          const sizes = JSON.parse(product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
          const sizeIndex = sizes.findIndex(s => s.size === selectedUnitSizeName)
          if (sizeIndex === -1) {
            throw new Error(`Unit size "${selectedUnitSizeName}" not found on product "${product.name}"`)
          }
          if (sizes[sizeIndex].quantity < quantityToDeduct) {
            throw new Error(`Insufficient stock for product "${product.name}" (${selectedUnitSizeName}). Available: ${sizes[sizeIndex].quantity}`)
          }

          // Deduct from unit size quantity
          const oldQty = sizes[sizeIndex].quantity
          sizes[sizeIndex].quantity -= quantityToDeduct
          priceUsed = Math.round(sizes[sizeIndex].price * (1 + totalGstRate / 100))

          const newUnitSizesStr = JSON.stringify(sizes)
          const newTotalQuantity = sizes.reduce((sum, s) => sum + s.quantity, 0)

          // Update product in DB
          await tx.product.update({
            where: { id: product.id },
            data: {
              unitSizes: newUnitSizesStr,
              quantity: newTotalQuantity
            }
          })

          // Log stock history
          await tx.stockHistory.create({
            data: {
              productId: product.id,
              oldQuantity: oldQty,
              newQuantity: sizes[sizeIndex].quantity,
              change: -quantityToDeduct,
              action: 'remove',
              reason: `Live Counter Stall sale [${selectedUnitSizeName}] at ${stallPlace}`
            }
          })
        } else {
          // Standard product
          if (product.quantity < quantityToDeduct) {
            throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.quantity}`)
          }

          const newQuantity = product.quantity - quantityToDeduct

          await tx.product.update({
            where: { id: product.id },
            data: { quantity: newQuantity }
          })

          // Log stock history
          await tx.stockHistory.create({
            data: {
              productId: product.id,
              oldQuantity: product.quantity,
              newQuantity: newQuantity,
              change: -quantityToDeduct,
              action: 'remove',
              reason: `Live Counter Stall sale at ${stallPlace}`
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

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          userId: customer.id,
          totalAmount,
          status: 'completed',
          paymentStatus: 'completed',
          shippingAddress: `${customerAddress.trim()} (Stall: ${stallPlace.trim()})`,
          orderType: 'live-counter',
          stallName: stallPlace.trim(),
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

      // Create Sales records for farmers
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
          paymentMethod: 'Cash/UPI at Stall',
          transactionId: `STALL-${Math.floor(10000000 + Math.random() * 90000000)}`
        }
      })

      return newOrder
    })

    return NextResponse.json(resultOrder, { status: 201 })
  } catch (error: any) {
    console.error('Counter checkout error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
