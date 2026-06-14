'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { printInvoice } from '@/lib/utils/invoice'

interface CartItem {
  id: string
  productId: string
  quantity: number
  unitSize: string | null
  product: {
    id: string
    name: string
    price: number
    category: string
    quantity: number // Stock
    unitSizes?: string
  }
}

interface Cart {
  id: string
  items: CartItem[]
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [shippingAddress, setShippingAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [guestName, setGuestName] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState<any>(null)
  const [selectedApartment, setSelectedApartment] = useState('')
  const [apartments, setApartments] = useState<any[]>([])

  const getItemPrice = (item: CartItem) => {
    if (item.unitSize && item.product.unitSizes) {
      try {
        const sizes = JSON.parse(item.product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
        const sizeObj = sizes.find(s => s.size === item.unitSize)
        if (sizeObj) return sizeObj.price
      } catch (e) {
        console.error(e)
      }
    }
    return item.product.price
  }

  const getItemMaxStock = (item: CartItem) => {
    if (item.unitSize && item.product.unitSizes) {
      try {
        const sizes = JSON.parse(item.product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
        const sizeObj = sizes.find(s => s.size === item.unitSize)
        if (sizeObj) return sizeObj.quantity
      } catch (e) {
        console.error(e)
      }
    }
    return item.product.quantity
  }

  const fetchCart = async () => {
    if (status === 'unauthenticated') {
      setLoading(true)
      try {
        const stored = localStorage.getItem('guestCart')
        const items = stored ? JSON.parse(stored) : []
        const prodRes = await fetch('/api/products')
        if (prodRes.ok) {
          const allProds = await prodRes.json() as any[]
          const mappedItems = items.map((item: any, index: number) => {
            const prod = allProds.find(p => p.id === item.productId)
            return {
              id: `guest-${index}`,
              productId: item.productId,
              quantity: item.quantity,
              unitSize: item.unitSize,
              product: prod || {
                id: item.productId,
                name: 'Unknown Produce',
                price: 0,
                category: 'Grains',
                quantity: 0
              }
            }
          })
          setCart({
            id: 'guest-cart',
            items: mappedItems
          })
        }
      } catch (err) {
        console.error('Guest cart mapping failed:', err)
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const data = await res.json()
        setCart(data)
      }
    } catch (err) {
      console.error('Failed to load cart:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile')
      if (res.ok) {
        const data = await res.json()
        if (data.address) {
          setShippingAddress(data.address)
        }
        if (data.phone) {
          setPhone(data.phone)
        }
      }
    } catch (err) {
      console.error('Failed to load user profile address:', err)
    }
  }

  useEffect(() => {
    if (status !== 'loading') {
      fetchCart()
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status])

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const res = await fetch('/api/stalls')
        if (res.ok) {
          const data = await res.json()
          setApartments(data)
          if (data.length > 0) {
            setSelectedApartment(data[0].name)
          }
        }
      } catch (err) {
        console.error('Failed to load apartments:', err)
      }
    }
    fetchApartments()
  }, [])

  const handleUpdateQuantity = async (productId: string, unitSize: string | null, newQuantity: number) => {
    if (newQuantity < 0) return
    if (status === 'unauthenticated') {
      const stored = localStorage.getItem('guestCart')
      let items = stored ? JSON.parse(stored) : []
      if (newQuantity === 0) {
        items = items.filter((item: any) => !(item.productId === productId && item.unitSize === unitSize))
      } else {
        items = items.map((item: any) => {
          if (item.productId === productId && item.unitSize === unitSize) {
            return { ...item, quantity: newQuantity }
          }
          return item
        })
      }
      localStorage.setItem('guestCart', JSON.stringify(items))
      fetchCart()
      return
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: newQuantity, unitSize }),
      })

      if (res.ok) {
        fetchCart()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update item quantity')
      }
    } catch (err) {
      console.error('Update quantity error:', err)
    }
  }

  const handleRemoveItem = async (productId: string, unitSize: string | null) => {
    if (status === 'unauthenticated') {
      const stored = localStorage.getItem('guestCart')
      let items = stored ? JSON.parse(stored) : []
      items = items.filter((item: any) => !(item.productId === productId && item.unitSize === unitSize))
      localStorage.setItem('guestCart', JSON.stringify(items))
      fetchCart()
      return
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, unitSize }),
      })

      if (res.ok) {
        fetchCart()
      }
    } catch (err) {
      console.error('Remove item error:', err)
    }
  }

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to empty your shopping cart?')) return
    if (status === 'unauthenticated') {
      localStorage.removeItem('guestCart')
      setCart({ id: 'guest-cart', items: [] })
      return
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true }),
      })

      if (res.ok) {
        fetchCart()
      }
    } catch (err) {
      console.error('Clear cart error:', err)
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'unauthenticated') {
      if (!guestName.trim()) {
        alert('Please enter your name to complete your checkout!')
        return
      }
    }
    if (!shippingAddress.trim()) {
      alert('Please enter a delivery address to complete your checkout!')
      return
    }
    if (!phone.trim()) {
      alert('Mobile number is mandatory for checkout!')
      return
    }

    setCheckoutLoading(true)
    try {
      let res
      if (status === 'unauthenticated') {
        res = await fetch('/api/orders/guest-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: guestName,
            phone,
            shippingAddress,
            stallName: selectedApartment,
            items: cart?.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitSize: item.unitSize
            }))
          }),
        })
      } else {
        res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shippingAddress, phone, stallName: selectedApartment }),
        })
      }

      const data = await res.json()

      if (res.ok) {
        setOrderCompleted(data)
        if (status === 'unauthenticated') {
          localStorage.removeItem('guestCart')
        }
        setCart(null)
      } else {
        alert(data.error || 'Checkout failed. Please verify item quantities.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Calculation summaries in INR
  const subtotal = cart?.items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0) || 0
  const shippingFee = subtotal > 0 ? 30.0 : 0.0 // Adjusted for INR scale
  const estimatedTax = subtotal * 0.08
  const grandTotal = subtotal + shippingFee + estimatedTax

  if (orderCompleted) {
    return (
      <ProtectedRoute allowedRoles={['customer', 'farmer', 'salesperson']} allowGuest>
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-lg text-center space-y-6">
            <span className="text-6xl block animate-bounce">🎉</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Placed Successfully!</h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your transaction has been processed securely. The billing log record was streaming live to the platform, and the farmer has been notified!
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-100 space-y-3 font-semibold text-sm max-w-md mx-auto">
              <div className="flex justify-between text-slate-500">
                <span>Order Reference:</span>
                <span className="font-extrabold text-slate-900 uppercase">{orderCompleted.id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Payment Status:</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">Completed</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Amount Charged:</span>
                <span className="font-black text-slate-900">₹{orderCompleted.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping Destination:</span>
                <span className="font-medium text-slate-950 text-right line-clamp-1">{orderCompleted.shippingAddress}</span>
              </div>
              {orderCompleted.stallName && (
                <div className="flex justify-between text-slate-500">
                  <span>Selected Apartment:</span>
                  <span className="font-black text-slate-900">{orderCompleted.stallName}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center pt-4 flex-wrap">
              <Button
                variant="outline"
                onClick={() => printInvoice({
                  ...orderCompleted,
                  user: {
                    name: session?.user?.name || guestName || 'Customer',
                    email: session?.user?.email || 'N/A',
                    phone: phone
                  }
                })}
              >
                🖨️ Print Invoice
              </Button>
              <Link href="/customer/dashboard">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              {status !== 'unauthenticated' && (
                <Link href="/customer/dashboard/orders">
                  <Button>Track My Orders</Button>
                </Link>
              )}
            </div>
          </div>
        </main>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['customer', 'farmer', 'salesperson']} allowGuest>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Your Shopping Cart</h1>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-5xl block mb-4">🛒</span>
            <h3 className="text-lg font-bold text-slate-900">Your Cart is Empty</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6 px-4">
              You haven't added any fresh produce to your cart yet.
            </p>
            <Link href="/customer/dashboard">
              <Button>Browse Home</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-500">
                  {cart.items.length} Unique Product{cart.items.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleClearCart}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
                >
                  Empty Cart
                </button>
              </div>

              {cart.items.map((item) => (
                <Card key={item.id} hoverEffect={false} className="bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100">
                  <div className="flex items-center gap-4">
                    {/* Item category emoji avatar */}
                    <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-3xl">
                      {item.product.category === 'Fruits' && '🍎'}
                      {item.product.category === 'Vegetables' && '🥦'}
                      {item.product.category === 'Grains' && '🌾'}
                      {item.product.category === 'Dairy' && '🥛'}
                      {item.product.category === 'Honey & Jams' && '🍯'}
                      {item.product.category === 'Herbs & Spices' && '🌿'}
                      {!['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Honey & Jams', 'Herbs & Spices'].includes(item.product.category) && '🌱'}
                    </div>

                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-emerald-600 block">
                        {item.product.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {item.product.name} {item.unitSize ? `(${item.unitSize})` : ''}
                      </h3>
                      <span className="text-xs font-extrabold text-slate-500 block mt-0.5">
                        ₹{getItemPrice(item).toFixed(2)} / unit
                      </span>
                    </div>
                  </div>

                  {/* Quantity and removal handlers */}
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.unitSize, item.quantity - 1)}
                        className="px-3 py-1.5 hover:bg-slate-200 transition font-bold text-slate-650"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-sm font-bold text-slate-950 bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.unitSize, item.quantity + 1)}
                        className="px-3 py-1.5 hover:bg-slate-200 transition font-bold text-slate-650"
                        disabled={item.quantity >= getItemMaxStock(item)}
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Total</span>
                      <span className="text-sm font-bold text-slate-950">
                        ₹{(getItemPrice(item) * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.productId, item.unitSize)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition"
                      title="Remove product"
                    >
                      ✕
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Cart Summary Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-lg space-y-6">
                <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-50 pb-4">
                  Order Summary
                </h3>

                <div className="space-y-3 font-semibold text-sm text-slate-500">
                  <div className="flex justify-between">
                    <span>Produce Subtotal</span>
                    <span className="text-slate-950">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    <span className="text-slate-950">₹{shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax (8%)</span>
                    <span className="text-slate-950">₹{estimatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-50 pt-4 text-slate-950">
                    <span className="text-base font-extrabold">Final Grand Total</span>
                    <span className="text-lg font-black">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping address & mobile number form */}
                <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-slate-50">
                  {status === 'unauthenticated' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Your Full Name <span className="text-rose-500 font-bold ml-1">^</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Delivery Address <span className="text-rose-500 font-bold ml-1">^</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your shipping address"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Select Apartment <span className="text-rose-500 font-bold ml-1">^</span>
                    </label>
                    <select
                      required
                      value={selectedApartment}
                      onChange={(e) => setSelectedApartment(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold bg-white"
                    >
                      <option value="" disabled>Select Apartment</option>
                      {apartments.map((apt: any) => (
                        <option key={apt.id} value={apt.name}>
                          {apt.name}
                        </option>
                      ))}
                      {apartments.length === 0 && (
                        <option value="" disabled>No Apartments Defined</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mobile Number <span className="text-rose-500 font-bold ml-1">^</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    loading={checkoutLoading}
                  >
                    Place Your Order (₹{grandTotal.toFixed(2)})
                  </Button>
                </form>

                <p className="text-xxs font-semibold text-slate-400 text-center uppercase tracking-wider block">
                  🛡️ Payments are simulated and securely logged.
                </p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
