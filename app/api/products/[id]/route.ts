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
    if (!session || !(session.user as any).id || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, price, category, image, unitSizes, stockUpdate } = await request.json()

    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const farmer = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    })

    if (!farmer || product.farmerId !== farmer.id) {
      return NextResponse.json({ error: 'Forbidden. You do not own this product.' }, { status: 403 })
    }

    let finalQuantity = product.quantity
    let finalPrice = product.price
    let finalUnitSizes = product.unitSizes
    let historyCreated = false
    let historyRecord: any = null

    if (stockUpdate) {
      const { action, value, reason, unitSizeId } = stockUpdate
      if (action && value !== undefined) {
        const valNum = parseInt(value)
        if (!isNaN(valNum) && valNum >= 0) {
          if (product.unitSizes) {
            // Product has multiple unit sizes
            const sizes = JSON.parse(product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
            const sizeObj = sizes.find(s => s.id === unitSizeId)
            if (!sizeObj) {
              return NextResponse.json({ error: 'Selected unit size not found' }, { status: 400 })
            }

            const oldQty = sizeObj.quantity
            let newQty = oldQty
            if (action === 'add') {
              newQty = oldQty + valNum
            } else if (action === 'remove' || action === 'damage') {
              newQty = Math.max(0, oldQty - valNum)
            } else if (action === 'set') {
              newQty = valNum
            }

            sizeObj.quantity = newQty
            finalUnitSizes = JSON.stringify(sizes)
            finalQuantity = sizes.reduce((sum, s) => sum + s.quantity, 0)
            finalPrice = sizes[0].price // price is first size's price

            historyRecord = {
              oldQuantity: product.quantity,
              newQuantity: finalQuantity,
              change: newQty - oldQty,
              action,
              reason: `[Size: ${sizeObj.size}] ${reason?.trim() || 'Manual stock update'}`
            }
            historyCreated = true
          } else {
            // Standard product
            const oldQuantity = product.quantity
            let newQuantity = oldQuantity
            if (action === 'add') {
              newQuantity = oldQuantity + valNum
            } else if (action === 'remove' || action === 'damage') {
              newQuantity = Math.max(0, oldQuantity - valNum)
            } else if (action === 'set') {
              newQuantity = valNum
            }

            finalQuantity = newQuantity
            historyRecord = {
              oldQuantity,
              newQuantity: newQuantity,
              change: newQuantity - oldQuantity,
              action,
              reason: reason?.trim() || 'Manual stock update'
            }
            historyCreated = true
          }
        }
      }
    } else if (unitSizes !== undefined) {
      // Product details edit with unit sizes
      const parsedSizes = JSON.parse(unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
      finalUnitSizes = unitSizes
      finalPrice = parsedSizes[0].price
      const totalQty = parsedSizes.reduce((sum, s) => sum + s.quantity, 0)
      
      const oldQuantity = product.quantity
      if (oldQuantity !== totalQty) {
        finalQuantity = totalQty
        historyRecord = {
          oldQuantity,
          newQuantity: totalQty,
          change: totalQty - oldQuantity,
          action: 'set',
          reason: 'Manual edit of unit size stock levels'
        }
        historyCreated = true
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name?.trim() || product.name,
        description: description?.trim() || product.description,
        price: price !== undefined ? parseFloat(price) : finalPrice,
        quantity: finalQuantity,
        unitSizes: finalUnitSizes,
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
  } catch (error: any) {
    console.error('Product detail PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const farmer = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
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
