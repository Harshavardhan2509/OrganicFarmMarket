'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Table from '@/components/ui/Table'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { printInvoice } from '@/lib/utils/invoice'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: {
    name: string
    category: string
  }
}

interface Order {
  id: string
  totalAmount: number
  status: string
  paymentStatus: string
  shippingAddress: string
  orderType: string
  createdAt: string
  items: OrderItem[]
  user: {
    name: string
    email: string
    phone?: string
    address?: string
  }
}

export default function StallSalesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [filterType, setFilterType] = useState<'day' | 'month'>('day')
  const [selectedDate, setSelectedDate] = useState('') // YYYY-MM-DD
  const [selectedMonth, setSelectedMonth] = useState('') // YYYY-MM

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        // Filter live counter orders globally
        const liveCounterOrders = data.filter((o: any) => o.orderType === 'live-counter')
        setOrders(liveCounterOrders)
      }
    } catch (err) {
      console.error('Failed to load orders for stall sales:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initialize filter inputs to current date/month in local timezone
    const now = new Date()
    const offsetMs = now.getTimezoneOffset() * 60 * 1000
    const localISODate = new Date(now.getTime() - offsetMs).toISOString()
    
    setSelectedDate(localISODate.split('T')[0])
    setSelectedMonth(localISODate.substring(0, 7))

    fetchOrders()
  }, [])

  useEffect(() => {
    if (orders.length === 0) {
      setFilteredOrders([])
      return
    }

    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.createdAt)

      if (filterType === 'day') {
        if (!selectedDate) return true
        const [year, month, day] = selectedDate.split('-').map(Number)
        return (
          orderDate.getFullYear() === year &&
          orderDate.getMonth() === month - 1 &&
          orderDate.getDate() === day
        )
      } else {
        if (!selectedMonth) return true
        const [year, month] = selectedMonth.split('-').map(Number)
        return (
          orderDate.getFullYear() === year &&
          orderDate.getMonth() === month - 1
        )
      }
    })

    setFilteredOrders(filtered)
  }, [orders, filterType, selectedDate, selectedMonth])

  // Computation
  const totalSalesAmount = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const salesCount = filteredOrders.length

  return (
    <ProtectedRoute allowedRoles={['farmer', 'salesperson']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stall Sales Logs</h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Track real-time orders completed by staff at live counter stalls.
            </p>
          </div>
        </div>

        {/* Filters and Summary metrics */}
        <div className="grid lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-7">
            <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6 h-full flex flex-col justify-center">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Filter Controls</h2>
              
              <div className="grid sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Filter By</label>
                  <select
                    className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none bg-slate-50 focus:border-emerald-500 transition"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                  >
                    <option value="day">📅 Specific Day</option>
                    <option value="month">🗓️ Entire Month</option>
                  </select>
                </div>

                {filterType === 'day' ? (
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="block w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-750 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Select Month</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="block w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-750 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <Card hoverEffect={true} className="bg-white border border-slate-100 shadow-md p-6 flex flex-col justify-center">
              <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Total Sales</span>
              <span className="text-2xl font-black text-emerald-700">₹{totalSalesAmount.toFixed(2)}</span>
            </Card>

            <Card hoverEffect={true} className="bg-white border border-slate-100 shadow-md p-6 flex flex-col justify-center">
              <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Orders Count</span>
              <span className="text-2xl font-black text-slate-900">{salesCount}</span>
            </Card>
          </div>
        </div>

        {/* Orders Log */}
        <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4 border-b border-slate-50 pb-2">
            Stall Sales Directory
          </h2>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-semibold italic">
              No sales logged for the selected time filter.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
                <Table headers={['Order Ref', 'Date & Time', 'Stall / Location', 'Customer Details', 'Items', 'Total Sale', 'Action']}>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition text-xs font-semibold text-slate-700">
                      <td className="px-6 py-4 font-black text-slate-900 uppercase">{order.id}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-slate-800">
                        {order.shippingAddress || <span className="text-slate-400 italic">Live Counter</span>}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="font-bold text-slate-900">{order.user?.name}</div>
                        <div className="text-xxs text-slate-450">{order.user?.phone || 'No Phone'}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="space-y-0.5">
                          {order.items.map((item) => (
                            <div key={item.id} className="truncate">
                              • {item.product.name} <span className="text-slate-400">(x{item.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printInvoice(order)}
                          className="py-1 text-xxs font-bold"
                        >
                          🖨️ Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-900 text-xs uppercase">Ref: {order.id}</span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <div>
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Stall / Location</span>
                        <span className="text-slate-800">{order.shippingAddress || 'Live Counter'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Customer</span>
                        <span className="text-slate-800 block truncate">{order.user?.name}</span>
                        <span className="text-[9px] text-slate-450 block">{order.user?.phone || 'No Phone'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Items</span>
                      <div className="space-y-0.5 max-h-24 overflow-y-auto bg-white border border-slate-150 rounded-lg p-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="text-xs font-medium text-slate-700 truncate">
                            • {item.product.name} <span className="text-slate-450 font-bold">(x{item.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total Sale</span>
                        <span className="text-sm font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printInvoice(order)}
                        className="py-1.5 px-3 text-xs font-bold bg-white shadow-sm"
                      >
                        🖨️ Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </main>
    </ProtectedRoute>
  )
}
