'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
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
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: string
  shippingAddress: string
  createdAt: string
  items: OrderItem[]
  user: {
    name: string
    email: string
    phone?: string
    address?: string
  }
}

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error('Failed to load farmer orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchOrders()
      } else {
        alert('Failed to update order status')
      }
    } catch (err) {
      console.error('Status transition error:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusVariant = (status: string) => {
    if (status === 'delivered') return 'success'
    if (status === 'shipped') return 'info'
    if (status === 'confirmed') return 'primary'
    if (status === 'cancelled') return 'danger'
    return 'warning'
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Received Orders</h1>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-5xl block mb-4">📬</span>
            <h3 className="text-lg font-bold text-slate-900">No Orders Received</h3>
            <p className="text-sm text-slate-500 mt-1 px-4">
              Once customers buy your fresh produce from the marketplace, their order requests will appear here for fulfillment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-50 pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900 uppercase">Order Ref: {order.id}</span>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-450 block mt-1 font-semibold">
                      Placed: {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Fulfillment controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printInvoice(order)}
                    >
                      🖨️ Invoice
                    </Button>
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        loading={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                      >
                        Confirm Order
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        loading={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                      >
                        🚢 Ship Produce
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button
                        size="sm"
                        loading={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      >
                        ✓ Complete Order
                      </Button>
                    )}
                    {['pending', 'confirmed'].includes(order.status) && (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  {/* Customer credentials */}
                  <div className="space-y-2.5 font-semibold text-xs text-slate-500">
                    <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Customer Contact</span>
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <span className="text-slate-900 font-bold ml-1.5">{order.user.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>
                      <span className="text-slate-900 ml-1.5">{order.user.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-slate-900 ml-1.5">{order.user.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Destination:</span>
                      <span className="text-slate-950 font-bold ml-1.5">{order.shippingAddress}</span>
                    </div>
                  </div>

                  {/* Item details */}
                  <div className="space-y-2.5">
                    <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">My Produce Ordered</span>
                    <div className="divide-y divide-slate-50 border border-slate-50 rounded-xl p-3 bg-slate-50/50">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1.5 text-xs font-semibold">
                          <span className="text-slate-800 font-bold">{item.product.name} (×{item.quantity})</span>
                          <span className="text-slate-950 font-black">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 font-bold text-xs text-slate-900 border-t border-slate-200 mt-1.5">
                        <span>My Share Income</span>
                        <span className="text-sm font-black text-emerald-700">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
