export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const customers = await prisma.user.findMany({
      where: { role: 'customer' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        orders: {
          select: {
            orderType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const customersWithChannel = customers.map(c => {
      const types = new Set(c.orders.map(o => o.orderType))
      let channel = 'pre-order' // default fallback
      if (types.has('live-counter') && types.has('pre-order')) {
        channel = 'both'
      } else if (types.has('live-counter')) {
        channel = 'live-counter'
      } else if (types.has('pre-order')) {
        channel = 'pre-order'
      } else {
        channel = 'none'
      }
      
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        createdAt: c.createdAt,
        purchaseChannel: channel
      }
    })

    return NextResponse.json(customersWithChannel)
  } catch (error: any) {
    console.error('Failed to fetch customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
