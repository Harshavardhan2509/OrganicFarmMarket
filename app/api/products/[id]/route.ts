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

    if (!product || product.isDeleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const cat = await prisma.category.findUnique({
      where: { name: product.category }
    })
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
        console.error('Failed to process unitSizes on product ID GET:', err)
      }
    }

    const processedProduct = {
      ...product,
      basePrice: product.price,
      price: displayPrice,
      unitSizes: processedUnitSizes
    }

    return NextResponse.json(processedProduct)
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
              oldQuantity: oldQty,
              newQuantity: newQty,
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
        
        // Create history records for each unit size that changed
        const oldSizes = product.unitSizes ? (JSON.parse(product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>) : []
        const historyRecordsToCreate: any[] = []
        
        for (const newSize of parsedSizes) {
          const oldSize = oldSizes.find(s => s.id === newSize.id || s.size === newSize.size)
          const oldQty = oldSize ? oldSize.quantity : 0
          const change = newSize.quantity - oldQty
          if (change !== 0) {
            historyRecordsToCreate.push({
              productId: params.id,
              oldQuantity: oldQty,
              newQuantity: newSize.quantity,
              change,
              action: 'set',
              reason: `[Size: ${newSize.size}] Manual edit of unit size stock levels`
            })
          }
        }
        
        // If there were sizes in oldSizes that are NOT in parsedSizes, treat them as deleted/0 stock
        for (const oldSize of oldSizes) {
          const newSize = parsedSizes.find(s => s.id === oldSize.id || s.size === oldSize.size)
          if (!newSize && oldSize.quantity > 0) {
            historyRecordsToCreate.push({
              productId: params.id,
              oldQuantity: oldSize.quantity,
              newQuantity: 0,
              change: -oldSize.quantity,
              action: 'remove',
              reason: `[Size: ${oldSize.size}] Removed unit size`
            })
          }
        }
        
        if (historyRecordsToCreate.length > 0) {
          for (const rec of historyRecordsToCreate) {
            await prisma.stockHistory.create({ data: rec })
          }
          historyCreated = false // Already created in the loop
        } else {
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

    await prisma.product.update({
      where: { id: params.id },
      data: { isDeleted: true }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product detail DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
