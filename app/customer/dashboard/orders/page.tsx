'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
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
    image?: string | null
  }
}

interface Order {
  id: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: string
  shippingAddress: string
  stallName?: string | null
  createdAt: string
  items: OrderItem[]
  user?: {
    name: string
    email: string
    phone?: string
  }
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Custom Reviews states
  const [activeReviewProduct, setActiveReviewProduct] = useState<any | null>(null)
  const [userRating, setUserRating] = useState<number>(5)
  const [userComment, setUserComment] = useState<string>('')
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false)

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error('Failed to fetch user orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleOpenReviewModal = async (productId: string, productName: string) => {
    setActiveReviewProduct({ id: productId, name: productName, reviews: [] })
    setUserRating(5)
    setUserComment('')
    try {
      const res = await fetch(`/api/products/${productId}`)
      if (res.ok) {
        const data = await res.json()
        setActiveReviewProduct(data)
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeReviewProduct) return
    setReviewSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: activeReviewProduct.id,
          rating: userRating,
          comment: userComment
        })
      })

      const data = await res.json()
      if (res.ok) {
        setUserComment('')
        setUserRating(5)
        const updatedProductRes = await fetch(`/api/products/${activeReviewProduct.id}`)
        if (updatedProductRes.ok) {
          const updatedProduct = await updatedProductRes.json()
          setActiveReviewProduct(updatedProduct)
        }
      } else {
        alert(data.error || 'Failed to submit review')
      }
    } catch (err) {
      console.error('Review submit error:', err)
      alert('An error occurred while submitting your review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const getStatusVariant = (status: string) => {
    if (status === 'delivered') return 'success'
    if (status === 'shipped') return 'info'
    if (status === 'confirmed') return 'primary'
    if (status === 'cancelled') return 'danger'
    return 'warning'
  }

  // Generate visual steps for the stepper
  const renderStepper = (currentStatus: string) => {
    if (currentStatus === 'cancelled') {
      return (
        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 font-semibold text-xs mt-4">
          <span>❌</span>
          <span>This order has been cancelled.</span>
        </div>
      )
    }

    const steps = [
      { name: 'Pending', key: 'pending' },
      { name: 'Confirmed', key: 'confirmed' },
      { name: 'Shipped', key: 'shipped' },
      { name: 'Delivered', key: 'delivered' }
    ]

    const currentIndex = steps.findIndex(step => step.key === currentStatus)

    return (
      <div className="mt-6 w-full">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex
            const isCurrent = idx === currentIndex

            return (
              <React.Fragment key={step.key}>
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1 relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-650 text-white shadow-md shadow-emerald-600/10'
                        : 'bg-white border-slate-200 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
                  >
                    {isCompleted && !isCurrent ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-xxs font-extrabold tracking-wider uppercase mt-2 transition ${
                      isCompleted ? 'text-emerald-700 font-black' : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>

                {/* Line joining circles */}
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      idx < currentIndex ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['customer', 'salesperson']}>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">My Orders</h1>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-5xl block mb-4">📋</span>
            <h3 className="text-lg font-bold text-slate-900">No Orders Found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6 px-4">
              You haven't placed any orders yet. Visit Home to find fresh organic harvests!
            </p>
            <Link href="/customer/dashboard">
              <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-md shadow-emerald-600/10">
                Shop Now
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <Card key={order.id} hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
                {/* Header detail banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-4 gap-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Order Reference</span>
                      <span className="text-sm font-black text-slate-900 uppercase">{order.id}</span>
                    </div>
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Order Date</span>
                      <span className="text-xs font-bold text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Shipping Destination</span>
                      <span className="text-xs font-semibold text-slate-700 line-clamp-1 max-w-[200px]" title={order.shippingAddress}>
                        {order.shippingAddress}
                      </span>
                    </div>
                    {order.stallName && (
                      <div>
                        <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Apartment / Stall</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {order.stallName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printInvoice(order)}
                    >
                      🖨️ Invoice
                    </Button>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge variant="success">
                      PAID
                    </Badge>
                  </div>
                </div>

                {/* Stepper tracking graphic */}
                <div className="py-4 border-b border-slate-50">
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block mb-2 leading-none">Fulfillment Stepper</span>
                  {renderStepper(order.status)}
                </div>

                {/* Order items listing */}
                <div className="pt-4 space-y-3">
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Produce Ordered</span>
                  <div className="divide-y divide-slate-50">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-lg overflow-hidden shrink-0 border border-slate-100">
                            {item.product.image ? (
                              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <>
                                {item.product.category === 'Fruits' && '🍎'}
                                {item.product.category === 'Vegetables' && '🥦'}
                                {item.product.category === 'Grains' && '🌾'}
                                {item.product.category === 'Dairy' && '🥛'}
                                {item.product.category === 'Honey & Jams' && '🍯'}
                                {item.product.category === 'Herbs & Spices' && '🌿'}
                                {!['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Honey & Jams', 'Herbs & Spices'].includes(item.product.category) && '🌱'}
                              </>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-900 block font-bold">{item.product.name}</span>
                            <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block mt-0.5">
                              {item.product.category}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(item.productId, item.product.name)}
                              className="text-xxs font-extrabold text-amber-600 hover:text-amber-705 transition flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-105/50 mt-1"
                            >
                              ⭐ Review Product
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 font-semibold">
                            {item.quantity} Unit{item.quantity > 1 ? 's' : ''} × ₹{item.price.toFixed(2)}
                          </span>
                          <span className="text-sm font-bold text-slate-950 block mt-0.5">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary row */}
                  <div className="flex justify-between items-center border-t border-slate-50 pt-4 mt-2">
                    <span className="text-sm font-bold text-slate-500">Order Aggregate</span>
                    <span className="text-xl font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Product Reviews Modal */}
        {activeReviewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 truncate max-w-[280px]">
                    Reviews for {activeReviewProduct.name}
                  </h3>
                  <span className="text-xxs font-extrabold uppercase tracking-wider text-emerald-600 block mt-0.5">
                    👨‍🌾 Sold by {activeReviewProduct.farmer?.name || 'Local Farmer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReviewProduct(null)}
                  className="text-slate-450 hover:text-slate-650 font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
                {/* Rating summary */}
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  {(() => {
                    const reviews = activeReviewProduct.reviews || []
                    const count = reviews.length
                    const avg = count
                      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / count).toFixed(1)
                      : null
                    return (
                      <>
                        <div className="text-center bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm shrink-0">
                          <span className="text-3xl font-black text-slate-900 block leading-none">{avg || 'N/A'}</span>
                          <span className="text-xxs font-bold text-slate-400 uppercase mt-1.5 block">Average</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-amber-500 text-lg">
                            {avg ? (
                              <>
                                {'★'.repeat(Math.round(Number(avg)))}{'☆'.repeat(5 - Math.round(Number(avg)))}
                              </>
                            ) : (
                              '☆☆☆☆☆'
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            Based on {count} review{count !== 1 ? 's' : ''} from verified customers.
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Submit review form */}
                <div className="border-t border-b border-slate-100 py-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">Submit or Update Your Review</h4>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Your Rating (out of 5)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setUserRating(stars)}
                            className="text-2xl transition hover:scale-110 active:scale-95"
                          >
                            <span className={userRating >= stars ? 'text-amber-500' : 'text-slate-200'}>
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400">
                        Your Comment
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Share your experience with this organic product..."
                        className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={reviewSubmitting}
                        loading={reviewSubmitting}
                        size="sm"
                      >
                        Publish Review
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                    Reviews List ({activeReviewProduct.reviews?.length || 0})
                  </span>
                  {(!activeReviewProduct.reviews || activeReviewProduct.reviews.length === 0) ? (
                    <p className="text-sm text-slate-450 italic font-medium py-4 text-center">No reviews submitted yet. Write the first review above!</p>
                  ) : (
                    <div className="space-y-3">
                      {activeReviewProduct.reviews.map((rev: any) => (
                        <div key={rev.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">{rev.user?.name || 'Customer'}</span>
                              <span className="text-xxs text-slate-400 font-medium">
                                {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="text-amber-500 text-sm font-black">
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </div>
                          </div>
                          <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveReviewProduct(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-lg font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
