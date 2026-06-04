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

    let cart = await prisma.cart.findFirst({
      where: { userId: (session.user as any).id },
      include: {
        items: {
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

    return NextResponse.json(cart)
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, quantity } = await request.json()

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
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.quantity < quantity) {
      return NextResponse.json({ error: 'Requested quantity exceeds available stock' }, { status: 400 })
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
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
          userId: (session.user as any).id
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
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, clearAll } = await request.json().catch(() => ({}))

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

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId
      }
    })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
