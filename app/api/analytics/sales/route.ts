export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const farmerId = (session.user as any).id

    // 1. Get total sales count and total revenue
    const sales = await prisma.sale.findMany({
      where: { farmerId },
      include: {
        order: {
          select: {
            status: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0)
    const activeOrdersCount = sales.filter(sale => sale.order.status !== 'completed' && sale.order.status !== 'cancelled').length

    // 2. Sales by day (for Recharts AreaChart)
    // We group sales by date formatted as YYYY-MM-DD
    const salesByDayMap = new Map<string, number>()
    
    // Seed last 7 days with 0 so the chart looks nice even if there are no sales
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      salesByDayMap.set(dateStr, 0)
    }

    sales.forEach(sale => {
      const dateStr = sale.date.toISOString().split('T')[0]
      if (salesByDayMap.has(dateStr)) {
        salesByDayMap.set(dateStr, salesByDayMap.get(dateStr)! + sale.amount)
      } else {
        salesByDayMap.set(dateStr, sale.amount)
      }
    })

    const salesHistory = Array.from(salesByDayMap.entries()).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue
    }))

    // 3. Sales by Product (top products category analysis)
    // Let's query products and aggregate how much revenue each generated
    const products = await prisma.product.findMany({
      where: { farmerId },
      include: {
        orderItems: true
      }
    })

    const productSalesData = products.map(prod => {
      const quantitySold = prod.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const revenue = quantitySold * prod.price
      return {
        name: prod.name,
        quantity: quantitySold,
        revenue,
        stock: prod.quantity
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // 4. Low stock items (quantity <= 5)
    const lowStockItems = products
      .filter(prod => prod.quantity <= 5)
      .map(prod => ({
        id: prod.id,
        name: prod.name,
        quantity: prod.quantity,
        category: prod.category
      }))

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalSalesCount: sales.length,
        activeOrdersCount,
        lowStockAlertCount: lowStockItems.length
      },
      salesHistory,
      productSalesData,
      lowStockItems
    })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
