export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        farmer: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true
          }
        },
        stockHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product detail GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, price, quantity, category, image, stockUpdate } = await request.json()

    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const farmer = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!farmer || product.farmerId !== farmer.id) {
      return NextResponse.json({ error: 'Forbidden. You do not own this product.' }, { status: 403 })
    }

    let finalQuantity = product.quantity
    let historyCreated = false
    let historyRecord: any = null

    if (stockUpdate) {
      const { action, value, reason } = stockUpdate
      if (action && value !== undefined) {
        const valNum = parseInt(value)
        if (!isNaN(valNum) && valNum >= 0) {
          const oldQuantity = product.quantity
          let newQuantity = oldQuantity
          if (action === 'add') {
            newQuantity = oldQuantity + valNum
          } else if (action === 'remove') {
            newQuantity = Math.max(0, oldQuantity - valNum)
          } else if (action === 'set') {
            newQuantity = valNum
          }

          finalQuantity = newQuantity
          
          historyRecord = {
            oldQuantity,
            newQuantity,
            change: newQuantity - oldQuantity,
            action,
            reason: reason?.trim() || 'Manual stock update'
          }
          historyCreated = true
        }
      }
    } else if (quantity !== undefined) {
      const oldQuantity = product.quantity
      const newQuantity = parseInt(quantity)
      if (oldQuantity !== newQuantity) {
        finalQuantity = newQuantity
        historyRecord = {
          oldQuantity,
          newQuantity,
          change: newQuantity - oldQuantity,
          action: 'set',
          reason: 'Manual edit'
        }
        historyCreated = true
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name?.trim() || product.name,
        description: description?.trim() || product.description,
        price: price !== undefined ? parseFloat(price) : product.price,
        quantity: finalQuantity,
        category: category || product.category,
        image: image || product.image
      }
    })

    if (historyCreated && historyRecord) {
      await prisma.stockHistory.create({
        data: {
          productId: params.id,
          ...historyRecord
        }
      })
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Product detail PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const farmer = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!farmer || product.farmerId !== farmer.id) {
      return NextResponse.json({ error: 'Forbidden. You do not own this product.' }, { status: 403 })
    }

    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product detail DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
