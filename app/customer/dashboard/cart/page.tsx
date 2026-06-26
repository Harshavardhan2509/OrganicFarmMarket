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
    image?: string | null
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
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState<any>(null)
  const [selectedApartment, setSelectedApartment] = useState('')
  const [apartments, setApartments] = useState<any[]>([])
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false) // Show billing breakdown modal before placing order

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategoriesList(data)
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    fetchCategories()
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

  const handleCheckout = (e: React.FormEvent) => {
    if (!shippingAddress.trim()) {
      alert('Please enter a delivery address to complete your checkout!')
      return
    }
    if (!selectedApartment.trim()) {
      alert('Apartment selection is mandatory for checkout!')
      return
    }
    if (!phone.trim()) {
      alert('Mobile number is mandatory for checkout!')
      return
    }

    setShowConfirmModal(true)
  }

  const executeOrderCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress, phone, stallName: selectedApartment }),
      })

      const data = await res.json()

      if (res.ok) {
        setOrderCompleted(data)
        setCart(null)
        setShowConfirmModal(false)
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
  const calculateTaxesAndTotals = () => {
    if (!cart || !cart.items) return { subtotal: 0, estimatedTax: 0 }
    let subtotalVal = 0
    let taxVal = 0
    
    cart.items.forEach(item => {
      const price = getItemPrice(item)
      const qty = item.quantity
      const categoryName = item.product.category
      
      const cat = categoriesList.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
      const cgst = cat ? cat.cgst : 0
      const sgst = cat ? cat.sgst : 0
      const gstRate = cgst + sgst
      
      const itemSubtotal = price * qty
      const itemTax = itemSubtotal * (gstRate / 100)
      
      subtotalVal += itemSubtotal
      taxVal += itemTax
    })
    
    return { subtotal: subtotalVal, estimatedTax: taxVal }
  }

  const { subtotal, estimatedTax } = calculateTaxesAndTotals()
  const shippingFee = subtotal > 0 ? 30.0 : 0.0 // Pre-order shipping cost is ₹30
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
                    name: session?.user?.name || 'Customer',
                    email: session?.user?.email || 'N/A',
                    phone: phone
                  }
                }, categoriesList)}
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
                    {/* Item category emoji avatar / product image */}
                    <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-3xl overflow-hidden shrink-0 border border-slate-100">
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

                    <div className="text-right min-w-[120px]">
                      <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Calculation</span>
                      <span className="text-xs font-bold text-slate-500 block mt-0.5">
                        {item.quantity} x ₹{getItemPrice(item).toFixed(2)}
                      </span>
                      <span className="text-sm font-black text-slate-950">
                        = ₹{(getItemPrice(item) * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.productId, item.unitSize)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition text-lg"
                      title="Remove product"
                    >
                      🗑️
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
                    <span>Estimated Tax (GST)</span>
                    <span className="text-slate-950">₹{estimatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-50 pt-4 text-slate-950">
                    <span className="text-base font-extrabold">Final Grand Total</span>
                    <span className="text-lg font-black">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping address & mobile number form */}
                {status === 'unauthenticated' ? (
                  <div className="bg-emerald-50/60 border border-emerald-150 rounded-2xl p-6 text-center space-y-4 pt-4 mt-4">
                    <span className="text-4xl block">🔐</span>
                    <h3 className="text-sm font-bold text-emerald-800">Sign In to Checkout</h3>
                    <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                      You must be signed in to complete your checkout. Please sign in or register to place your order.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                      <Link href="/auth/login" className="flex-1">
                        <Button variant="primary" className="w-full text-xs py-2 font-extrabold">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/register" className="flex-1">
                        <Button variant="outline" className="w-full text-xs py-2 bg-white font-extrabold">
                          Register
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Delivery Address <span className="text-rose-500 font-bold ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your shipping address"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-955 outline-none transition focus:border-emerald-500 font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Select Apartment <span className="text-rose-500 font-bold ml-1">*</span>
                      </label>
                      <select
                        required
                        value={selectedApartment}
                        onChange={(e) => setSelectedApartment(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-955 outline-none transition focus:border-emerald-500 font-semibold bg-white"
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
                        Mobile Number <span className="text-rose-500 font-bold ml-1">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-955 outline-none transition focus:border-emerald-500 font-semibold"
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
                )}

                <p className="text-xxs font-semibold text-slate-400 text-center uppercase tracking-wider block">
                  🛡️ Payments are simulated and securely logged.
                </p>
              </Card>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Review & Confirm Your Order
                  </h3>
                  <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                    Please verify your billing breakdown before placing order
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="text-slate-450 hover:text-slate-655 font-bold transition text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0 text-left text-xs">
                
                {/* Deliver details summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                  <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-2">Delivery Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-455 font-bold block uppercase text-[9px]">Deliver To:</span>
                      <span className="font-black text-slate-800">{session?.user?.name || 'Valued Customer'}</span>
                    </div>
                    <div>
                      <span className="text-slate-455 font-bold block uppercase text-[9px]">Mobile Number:</span>
                      <span className="font-black text-slate-800">{phone}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-455 font-bold block uppercase text-[9px]">Apartment:</span>
                    <span className="font-black text-slate-850 block">{selectedApartment}</span>
                    <span className="text-slate-455 font-bold block uppercase text-[9px] mt-2">Shipping Address:</span>
                    <span className="font-medium text-slate-700 block">{shippingAddress}</span>
                  </div>
                </div>

                {/* Items Breakdown list */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">Items Breakdown</h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl p-3 bg-white max-h-[160px] overflow-y-auto">
                    {cart?.items.map((item) => {
                      const price = getItemPrice(item)
                      const itemTotal = price * item.quantity
                      const cat = categoriesList.find(c => c.name.toLowerCase() === item.product.category.toLowerCase())
                      const cgst = cat ? cat.cgst : 0
                      const sgst = cat ? cat.sgst : 0
                      const gstRate = cgst + sgst
                      const basePrice = price / (1 + gstRate / 100)
                      const taxAmt = basePrice * item.quantity * (gstRate / 100)
                      
                      return (
                        <div key={item.id} className="py-2 flex justify-between items-center first:pt-0 last:pb-0 font-semibold">
                          <div>
                            <span className="text-slate-900 font-bold block text-[11px] truncate max-w-[220px]">
                              {item.product.name} {item.unitSize ? `(${item.unitSize})` : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Tax Rate: {gstRate}% | GST: ₹{taxAmt.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-550 block font-bold">
                              {item.quantity} x ₹{price.toFixed(2)}
                            </span>
                            <span className="text-sm font-black text-slate-900 block">
                              = ₹{itemTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Detailed Invoice-like Breakdown */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                  <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-2">Price Breakdown</h4>
                  <div className="flex justify-between font-bold text-slate-550">
                    <span>Produce Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-550">
                    <span>CGST (Taxes):</span>
                    <span>₹{(estimatedTax / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-550">
                    <span>SGST (Taxes):</span>
                    <span>₹{(estimatedTax / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-550">
                    <span>Delivery Charges:</span>
                    <span>₹{shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-2.5 mt-2 font-black text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-base text-emerald-800">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

              </div>

              {/* Footer CTA */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={checkoutLoading}
                >
                  Cancel & Edit
                </Button>
                <Button
                  type="button"
                  onClick={executeOrderCheckout}
                  loading={checkoutLoading}
                  disabled={checkoutLoading}
                >
                  Confirm & Place Order (₹{grandTotal.toFixed(2)})
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
