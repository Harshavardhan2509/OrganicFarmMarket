export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['farmer', 'salesperson'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const userId = (session.user as any).id

    // Get filter query parameters
    const searchParams = request.nextUrl.searchParams
    let orderType = searchParams.get('orderType') || 'all' // all, pre-order, live-counter
    const timeframe = searchParams.get('timeframe') || 'weekly' // weekly, monthly, yearly
    const apartment = searchParams.get('apartment') || 'all' // all, [apartment name]

    // Sales person is strictly limited to live-counter
    if (userRole === 'salesperson') {
      orderType = 'live-counter'
    }

    // 1. Get sales.
    // If the role is farmer, only get sales where the sale record belongs to the farmer.
    // If the role is salesperson, salespeople see all stall sales.
    let salesWhereClause: any = {}
    if (userRole === 'farmer') {
      salesWhereClause.farmerId = userId
    }

    // Filter by orderType
    if (orderType !== 'all') {
      salesWhereClause.order = {
        orderType: orderType
      }
    }

    // Filter by apartment (only for pre-orders)
    if (orderType !== 'live-counter' && apartment !== 'all') {
      salesWhereClause.order = {
        ...salesWhereClause.order,
        stallName: apartment
      }
    }

    const sales = await prisma.sale.findMany({
      where: salesWhereClause,
      include: {
        order: {
          select: {
            status: true,
            orderType: true,
            stallName: true,
            createdAt: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Apply Timeframe filter in memory to keep it extremely simple and consistent
    const now = new Date()
    let startDate = new Date()
    if (timeframe === 'weekly') {
      startDate.setDate(now.getDate() - 7)
    } else if (timeframe === 'monthly') {
      startDate.setDate(now.getDate() - 30)
    } else if (timeframe === 'yearly') {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date)
      return saleDate >= startDate
    })

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.amount, 0)
    const activeOrdersCount = filteredSales.filter(sale => sale.order.status !== 'completed' && sale.order.status !== 'cancelled').length

    // 2. Sales History (chart data)
    const salesHistoryMap = new Map<string, number>()

    if (timeframe === 'yearly') {
      // Seed last 12 months with 0
      for (let i = 11; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
        salesHistoryMap.set(yearMonth, 0)
      }

      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.date)
        const yearMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
        if (salesHistoryMap.has(yearMonth)) {
          salesHistoryMap.set(yearMonth, salesHistoryMap.get(yearMonth)! + sale.amount)
        }
      })

      var salesHistory = Array.from(salesHistoryMap.entries()).map(([ym, revenue]) => {
        const [year, month] = ym.split('-')
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1)
        return {
          date: dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue
        }
      })
    } else {
      // Weekly or Monthly (seed by day)
      const daysCount = timeframe === 'monthly' ? 30 : 7
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        salesHistoryMap.set(dateStr, 0)
      }

      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.date)
        const dateStr = saleDate.toISOString().split('T')[0]
        if (salesHistoryMap.has(dateStr)) {
          salesHistoryMap.set(dateStr, salesHistoryMap.get(dateStr)! + sale.amount)
        }
      })

      var salesHistory = Array.from(salesHistoryMap.entries()).map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue
      }))
    }

    // 3. Sales by Product (top products category analysis)
    // Find all products. If farmer, restrict to their own. If salesperson, query all.
    const products = await prisma.product.findMany({
      where: userRole === 'farmer' ? { farmerId: userId } : {},
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                createdAt: true,
                orderType: true,
                stallName: true
              }
            }
          }
        }
      }
    })

    const productSalesData = products.map(prod => {
      // Filter orderItems that match the current timeframe, orderType, and apartment filters
      const matchingItems = prod.orderItems.filter(item => {
        const orderDate = new Date(item.order.createdAt)
        if (orderDate < startDate) return false

        if (orderType !== 'all') {
          if (item.order.orderType !== orderType) return false
        }

        if (orderType !== 'live-counter' && apartment !== 'all') {
          if (item.order.stallName !== apartment) return false
        }

        return true
      })

      const quantitySold = matchingItems.reduce((sum, item) => sum + item.quantity, 0)
      const revenue = matchingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        name: prod.name,
        quantity: quantitySold,
        revenue,
        stock: prod.quantity
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // 4. Low stock items (alert for individual unit sizes separately if stock <= 5)
    const lowStockItems: any[] = []
    products.forEach(prod => {
      if (prod.isDeleted) return
      if (prod.unitSizes) {
        try {
          const sizes = JSON.parse(prod.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
          sizes.forEach(s => {
            if (s.quantity <= 5) {
              lowStockItems.push({
                id: `${prod.id}-${s.id}`,
                productId: prod.id,
                name: `${prod.name} (${s.size})`,
                quantity: s.quantity,
                category: prod.category
              })
            }
          })
        } catch {
          if (prod.quantity <= 5) {
            lowStockItems.push({
              id: prod.id,
              productId: prod.id,
              name: prod.name,
              quantity: prod.quantity,
              category: prod.category
            })
          }
        }
      } else {
        if (prod.quantity <= 5) {
          lowStockItems.push({
            id: prod.id,
            productId: prod.id,
            name: prod.name,
            quantity: prod.quantity,
            category: prod.category
          })
        }
      }
    })

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalSalesCount: filteredSales.length,
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
