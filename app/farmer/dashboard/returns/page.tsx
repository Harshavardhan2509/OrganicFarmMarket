'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
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
  status: string
  paymentStatus: string
  shippingAddress: string
  stallName?: string | null
  createdAt: string
  items: OrderItem[]
  user: {
    name: string
    email: string
    phone?: string
    address?: string
  }
}

export default function FarmerReturnsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        // Filter for return/replace statuses
        const returnOrders = data.filter((order: any) => 
          [
            'return-requested', 
            'replace-requested', 
            'returned', 
            'replaced', 
            'return-rejected', 
            'replace-rejected'
          ].includes(order.status)
        )
        setOrders(returnOrders)
      }
    } catch (err) {
      console.error('Failed to load farmer return orders:', err)
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
        alert(`Status updated to ${newStatus.replace('-', ' ')} successfully!`)
      } else {
        alert('Failed to update status')
      }
    } catch (err) {
      console.error('Status transition error:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'return-requested':
        return <Badge variant="warning">Return Requested</Badge>
      case 'replace-requested':
        return <Badge variant="warning">Replacement Requested</Badge>
      case 'returned':
        return <Badge variant="success">Returned & Refunded</Badge>
      case 'replaced':
        return <Badge variant="success">Replaced</Badge>
      case 'return-rejected':
        return <Badge variant="danger">Return Rejected</Badge>
      case 'replace-rejected':
        return <Badge variant="danger">Replacement Rejected</Badge>
      default:
        return <Badge variant="info">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Returns & Replacements</h1>
          <p className="text-sm text-slate-550 font-semibold mt-1">
            Analyze, approve, or decline return and replacement requests submitted by customers for online pre-orders.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-5xl block mb-4">🔄</span>
            <h3 className="text-lg font-bold text-slate-900">No Return Requests</h3>
            <p className="text-sm text-slate-500 mt-1 px-4">
              There are no pending or history of returned or replaced orders at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-50 pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-black text-slate-900 uppercase">Order ID: #{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-xs text-slate-450 block mt-1 font-semibold">
                      Placed: {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Return management actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printInvoice(order)}
                    >
                      🖨️ View Invoice
                    </Button>
                    
                    {order.status === 'return-requested' && (
                      <>
                        <Button
                          size="sm"
                          loading={updatingId === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'returned')}
                        >
                          Approve Return
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          loading={updatingId === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'return-rejected')}
                        >
                          Reject Request
                        </Button>
                      </>
                    )}

                    {order.status === 'replace-requested' && (
                      <>
                        <Button
                          size="sm"
                          loading={updatingId === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'replaced')}
                        >
                          Approve Replacement
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          loading={updatingId === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'replace-rejected')}
                        >
                          Reject Request
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Customer information & shipping details */}
                <div className="py-4 border-b border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div className="space-y-1">
                    <span className="block font-extrabold uppercase text-[10px] text-slate-400">Customer Info</span>
                    <p className="text-slate-900 font-bold">{order.user?.name}</p>
                    <p>Phone: {order.user?.phone || 'N/A'}</p>
                    <p>Email: {order.user?.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-extrabold uppercase text-[10px] text-slate-400">Destination</span>
                    {order.stallName && <p className="text-slate-900 font-bold">Apartment: {order.stallName}</p>}
                    <p className="line-clamp-2">Address: {order.shippingAddress}</p>
                  </div>
                </div>

                {/* Items listing */}
                <div className="pt-4 space-y-3">
                  <span className="block font-extrabold uppercase text-[10px] text-slate-400">Order Items</span>
                  <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl bg-slate-50/50 p-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0 font-semibold text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 truncate block">{item.product?.name}</span>
                          <span className="text-[10px] text-slate-450 uppercase block font-bold">{item.product?.category}</span>
                        </div>
                        <span className="w-24 text-center text-slate-700">{item.quantity} units</span>
                        <span className="w-24 text-right text-slate-900 font-black">₹{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    
                    <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-2 text-xs font-black text-slate-900">
                      <span>Total Invoice Value:</span>
                      <span className="text-sm font-black text-emerald-800">₹{order.totalAmount.toFixed(2)}</span>
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
