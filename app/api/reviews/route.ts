export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('productId')
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
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
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email || (session.user as any).role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized. Customers only.' }, { status: 401 })
    }

    const { productId, rating, comment } = await request.json()

    if (!productId || rating === undefined || !comment) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const ratingVal = parseInt(rating)
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert review (since userId, productId has unique index)
    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      },
      update: {
        rating: ratingVal,
        comment: comment.trim()
      },
      create: {
        userId: user.id,
        productId,
        rating: ratingVal,
        comment: comment.trim()
      }
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Review POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
