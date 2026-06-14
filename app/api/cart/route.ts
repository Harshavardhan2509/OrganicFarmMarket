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

    let cart = await prisma.cart.findFirst({
      where: { userId: (session.user as any).id },
      include: {
        items: {
          where: {
            product: {
              isDeleted: false
            }
          },
          include: {
            product: true
          }
        }
      }
    })

    // Fallback: If cart doesn't exist, create it dynamically
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: (session.user as any).id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })
    }

    // Now process the products inside the cart to have displayPrice as price
    const categories = await prisma.category.findMany()
    if (cart.items) {
      cart.items = cart.items.map(item => {
        const product = item.product
        if (!product) return item
        
        const cat = categories.find(c => c.name === product.category)
        const cgst = cat ? cat.cgst : 0
        const sgst = cat ? cat.sgst : 0
        const totalGstRate = cgst + sgst
        
        const displayPrice = Math.round(product.price * (1 + totalGstRate / 100))
        
        let processedUnitSizes = product.unitSizes
        if (product.unitSizes) {
          try {
            const sizes = JSON.parse(product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
            const updatedSizes = sizes.map(s => ({
              ...s,
              basePrice: s.price,
              price: Math.round(s.price * (1 + totalGstRate / 100))
            }))
            processedUnitSizes = JSON.stringify(updatedSizes)
          } catch (err) {
            console.error('Failed to process unitSizes on cart GET:', err)
          }
        }

        ;(item as any).product = {
          ...product,
          basePrice: product.price,
          price: displayPrice,
          unitSizes: processedUnitSizes
        }
        return item
      })
    }

    return NextResponse.json(cart)
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, quantity, unitSize } = await request.json()

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 })
    }

    let cart = await prisma.cart.findFirst({
      where: { userId: (session.user as any).id }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: (session.user as any).id }
      })
    }

    // Check product availability
    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let maxStock = product.quantity
    if (product.unitSizes) {
      try {
        const sizes = JSON.parse(product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
        const sizeObj = sizes.find(s => s.size === unitSize)
        if (sizeObj) {
          maxStock = sizeObj.quantity
        }
      } catch (e) {
        console.error('Failed to parse product unit sizes:', e)
      }
    }

    if (maxStock < quantity) {
      return NextResponse.json({ error: 'Requested quantity exceeds available stock' }, { status: 400 })
    }

    // Check if item already exists in cart with the specified unit size
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_unitSize: {
          cartId: cart.id,
          productId,
          unitSize: unitSize || null
        }
      }
    })

    let cartItem
    if (existingCartItem) {
      if (quantity <= 0) {
        // Delete item if quantity set to 0 or less
        await prisma.cartItem.delete({
          where: { id: existingCartItem.id }
        })
        return NextResponse.json({ message: 'Item removed from cart' })
      } else {
        // Update quantity
        cartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity }
        })
      }
    } else {
      if (quantity <= 0) {
        return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
      }
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          userId: (session.user as any).id,
          unitSize: unitSize || null
        }
      })
    }

    return NextResponse.json(cartItem)
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, unitSize, clearAll } = await request.json().catch(() => ({}))

    const cart = await prisma.cart.findFirst({
      where: { userId: (session.user as any).id }
    })

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    if (clearAll) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
      return NextResponse.json({ message: 'Cart cleared successfully' })
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required to remove specific item' }, { status: 400 })
    }

    const deleteWhere: any = {
      cartId: cart.id,
      productId
    }
    if (unitSize !== undefined) {
      deleteWhere.unitSize = unitSize || null
    }

    await prisma.cartItem.deleteMany({
      where: deleteWhere
    })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
