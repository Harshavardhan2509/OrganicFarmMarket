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
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        billingLogs: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify user owns/is involved in the order
    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole === 'customer' && order.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (userRole === 'farmer') {
      const hasFarmerItem = order.items.some(item => item.product.farmerId === userId)
      if (!hasFarmerItem) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order detail GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify farmer owns at least one item in the order
    const farmerId = (session.user as any).id
    const isAssociated = order.items.some(item => item.product.farmerId === farmerId)

    if (!isAssociated) {
      return NextResponse.json({ error: 'Forbidden. You do not own items in this order.' }, { status: 403 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Order detail PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
