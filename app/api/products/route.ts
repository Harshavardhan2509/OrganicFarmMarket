export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort')

    let whereClause: any = {}

    if (category && category !== 'All') {
      whereClause.category = category
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    let orderByClause: any = { createdAt: 'desc' }

    if (sort === 'price-asc') {
      orderByClause = { price: 'asc' }
    } else if (sort === 'price-desc') {
      orderByClause = { price: 'desc' }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        farmer: {
          select: {
            name: true,
            email: true
          }
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const { name, description, price, quantity, category, image } = await request.json()

    if (!name || !description || price === undefined || quantity === undefined || !category) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const farmer = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!farmer) {
      return NextResponse.json({ error: 'Farmer account not found' }, { status: 404 })
    }

    // Generate sequenced ID starting from 100
    const existingProducts = await prisma.product.findMany({
      select: { id: true }
    })
    const numericIds = existingProducts
      .map(p => parseInt(p.id))
      .filter(id => !isNaN(id) && id >= 100)
    const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 100
    const nextIdStr = nextId.toString()

    const product = await prisma.product.create({
      data: {
        id: nextIdStr,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category,
        image: image || null,
        farmerId: farmer.id,
        farmerEmail: farmer.email
      }
    })

    // Log initial stock setup
    await prisma.stockHistory.create({
      data: {
        productId: product.id,
        oldQuantity: 0,
        newQuantity: product.quantity,
        change: product.quantity,
        action: 'set',
        reason: 'Initial stock setup'
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Product POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
