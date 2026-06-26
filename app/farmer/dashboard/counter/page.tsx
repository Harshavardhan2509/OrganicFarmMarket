'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PRODUCT_CATEGORIES } from '@/config/constants'
import { printInvoice } from '@/lib/utils/invoice'

interface Product {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  category: string
  farmerId: string
  unitSizes?: string | null
  image?: string | null
  upcomingStock?: string | null
}

interface CartItem {
  product: Product
  quantity: number
  unitSize: string | null
  price: number
}

export default function LiveCounterPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  // Mandatory Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Mandatory Stall details
  const [stallPlace, setStallPlace] = useState('')
  const [stallAreas, setStallAreas] = useState<any[]>([])
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Track selected unit sizes
  const [selectedUnitSizes, setSelectedUnitSizes] = useState<Record<string, string>>({})

  const [categories, setCategories] = useState<string[]>(Array.from(PRODUCT_CATEGORIES))
  const [categoriesFullList, setCategoriesFullList] = useState<any[]>([])

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const allProducts = await res.json()
        setProducts(allProducts)
        setFilteredProducts(allProducts)
      }
    } catch (err) {
      console.error('Failed to load inventory for counter:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategoriesFullList(data)
        setCategories(data.map((c: any) => c.name))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchStallAreas = async () => {
    try {
      const res = await fetch('/api/stalls')
      if (res.ok) {
        const data = await res.json()
        setStallAreas(data)
        if (data.length > 0) {
          setStallPlace(data[0].name)
        }
      }
    } catch (err) {
      console.error('Failed to load stall locations:', err)
    }
  }

  useEffect(() => {
    fetchInventory()
    fetchCategories()
    fetchStallAreas()
  }, [])

  useEffect(() => {
    let filtered = products

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query))
    }

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory, products])

  // Get active size details for a product
  const getProductSizeDetails = (product: Product) => {
    if (!product.unitSizes) return null
    try {
      const sizes = JSON.parse(product.unitSizes) as Array<{ id: string; size: string; price: number; quantity: number }>
      return sizes
    } catch {
      return null
    }
  }

  const addToCart = (product: Product, qty: number = 1) => {
    const sizes = getProductSizeDetails(product)
    let unitSizeName: string | null = null
    let priceUsed = product.price
    let availableQty = product.quantity

    if (sizes && sizes.length > 0) {
      const chosen = selectedUnitSizes[product.id] || sizes[0].size
      const sizeObj = sizes.find(s => s.size === chosen)
      if (sizeObj) {
        unitSizeName = sizeObj.size
        priceUsed = sizeObj.price
        availableQty = sizeObj.quantity
      }
    }

    const existing = cart.find(
      (item) => item.product.id === product.id && item.unitSize === unitSizeName
    )
    const currentQtyInCart = existing ? existing.quantity : 0

    if (availableQty < currentQtyInCart + qty) {
      alert(`Cannot add ${qty} units. Only ${availableQty - currentQtyInCart} units can be added (Total available: ${availableQty}).`)
      return
    }

    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id && item.unitSize === unitSizeName
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      )
    } else {
      setCart([...cart, { product, quantity: qty, unitSize: unitSizeName, price: priceUsed }])
    }
  }

  const updateCartQuantity = (productId: string, unitSizeName: string | null, newQty: number) => {
    const item = cart.find((i) => i.product.id === productId && i.unitSize === unitSizeName)
    if (!item) return

    if (newQty <= 0) {
      setCart(cart.filter((i) => !(i.product.id === productId && i.unitSize === unitSizeName)))
      return
    }

    const sizes = getProductSizeDetails(item.product)
    let availableQty = item.product.quantity

    if (sizes && sizes.length > 0 && unitSizeName) {
      const sizeObj = sizes.find(s => s.size === unitSizeName)
      if (sizeObj) {
        availableQty = sizeObj.quantity
      }
    }

    if (availableQty < newQty) {
      alert(`Cannot exceed stock limits. Only ${availableQty} unit(s) available.`)
      return
    }

    setCart(
      cart.map((i) => (i.product.id === productId && i.unitSize === unitSizeName ? { ...i, quantity: newQty } : i))
    )
  }

  const calculateLiveCounterTotals = () => {
    let subVal = 0
    let cgstVal = 0
    let sgstVal = 0
    
    cart.forEach(item => {
      const price = item.price
      const qty = item.quantity
      const categoryName = item.product.category
      
      const cat = categoriesFullList.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
      const cgstRate = cat ? cat.cgst : 0
      const sgstRate = cat ? cat.sgst : 0
      
      const itemSubtotal = price * qty
      subVal += itemSubtotal
      cgstVal += itemSubtotal * (cgstRate / 100)
      sgstVal += itemSubtotal * (sgstRate / 100)
    })
    
    return {
      subtotal: subVal,
      cgst: cgstVal,
      sgst: sgstVal,
      grandTotal: subVal + cgstVal + sgstVal
    }
  }

  const { subtotal, cgst, sgst, grandTotal } = calculateLiveCounterTotals()

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert('Your billing cart is empty.')
      return
    }
    if (!customerName.trim()) {
      alert('Customer name is mandatory.')
      return
    }
    if (!customerPhone.trim()) {
      alert('Customer mobile number is mandatory.')
      return
    }
    if (!stallPlace.trim()) {
      alert('Apartment selection is mandatory.')
      return
    }

    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/counter/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          stallPlace,
          cart: cart.map(item => ({
            product: { id: item.product.id },
            quantity: item.quantity,
            unitSize: item.unitSize
          }))
        })
      })

      const orderData = await res.json()
      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to checkout transaction.')
      }

      // Print the invoice
      printInvoice({
        ...orderData,
        user: {
          name: customerName,
          email: 'N/A',
          phone: customerPhone
        }
      }, categoriesFullList)

      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      if (stallAreas.length > 0) {
        setStallPlace(stallAreas[0].name)
      } else {
        setStallPlace('')
      }
      await fetchInventory()
      alert('Transaction Completed and Saved Successfully!')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to complete checkout transaction.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer', 'salesperson']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col lg:h-[calc(100vh-64px)]">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Live Counter Point of Sale</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Calculate customer bills dynamically, register customer details, and deduct inventory during physical market stalls.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 flex-1 lg:overflow-hidden min-h-0">
          {/* Left panel - Inventory Produce Selector */}
          <div className="lg:col-span-7 flex flex-col lg:h-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:overflow-hidden min-h-0">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search produce..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="w-full sm:w-48">
                <select
                  className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none bg-white transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable produce listing */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                <span className="text-5xl block mb-3">🚜</span>
                <p className="text-sm font-bold">No stock found in this category.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-4 content-start">
                {filteredProducts.map((product) => {
                  const sizes = getProductSizeDetails(product)
                  const hasSizes = sizes && sizes.length > 0
                  
                  // Compute active stock and price
                  let activePrice = product.price
                  let activeStock = product.quantity
                  let outOfStock = product.quantity <= 0

                  if (hasSizes) {
                    const chosen = selectedUnitSizes[product.id] || sizes![0].size
                    const chosenObj = sizes!.find(s => s.size === chosen)
                    if (chosenObj) {
                      activePrice = chosenObj.price
                      activeStock = chosenObj.quantity
                      outOfStock = activeStock <= 0
                    }
                  }

                  const chosenUnitSizeName = hasSizes ? (selectedUnitSizes[product.id] || sizes![0].size) : null
                  const existingCartItem = cart.find(
                    (item) => item.product.id === product.id && item.unitSize === chosenUnitSizeName
                  )
                  const cartQty = existingCartItem ? existingCartItem.quantity : 0

                  return (
                    <Card
                      key={product.id}
                      hoverEffect={!outOfStock}
                      className={`p-3.5 border border-slate-150 bg-white flex flex-col transition rounded-3xl h-full shadow-sm ${
                        outOfStock ? 'opacity-60 bg-slate-50/50' : 'hover:border-emerald-300'
                      }`}
                    >
                      {/* Full-width image header container */}
                      <div className="w-full h-28 bg-emerald-50/40 rounded-2xl flex items-center justify-center text-4xl mb-3 select-none overflow-hidden border border-slate-100 relative shrink-0">
                        {/* Category pill overlaid top-left */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <Badge variant="info" className="opacity-95 text-[9px] px-2 py-0.5 font-extrabold uppercase tracking-wider">
                            {product.category}
                          </Badge>
                        </div>
                        
                        {/* Stock Warning overlaid top-right */}
                        {outOfStock ? (
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <Badge variant="danger" className="text-[9px] px-2 py-0.5 font-bold">Sold Out</Badge>
                          </div>
                        ) : activeStock > 0 && activeStock <= 5 ? (
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <Badge variant="warning" className="text-[9px] px-2 py-0.5 font-bold">Only {activeStock} Left</Badge>
                          </div>
                        ) : null}

                        {(() => {
                          if (!product.image) return null;
                          let displayImg = product.image;
                          if (product.image.startsWith('[')) {
                            try {
                              const parsed = JSON.parse(product.image);
                              if (Array.isArray(parsed) && parsed.length > 0) {
                                displayImg = parsed[0];
                              }
                            } catch {}
                          }
                          return displayImg ? (
                            <img src={displayImg} alt={product.name} className="w-full h-full object-cover" />
                          ) : null;
                        })()}
                        {!product.image && (
                          <>
                            {product.category === 'Fruits' && '🍎'}
                            {product.category === 'Vegetables' && '🥦'}
                            {product.category === 'Grains' && '🌾'}
                            {product.category === 'Dairy' && '🥛'}
                            {product.category === 'Honey & Jams' && '🍯'}
                            {product.category === 'Herbs & Spices' && '🌿'}
                            {!['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Honey & Jams', 'Herbs & Spices'].includes(product.category) && '🌱'}
                          </>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-xs tracking-tight leading-snug line-clamp-1 mb-1.5" title={product.name}>
                            {product.name}
                          </h3>
                          
                          {/* Dropdown for multiple unit sizes if defined */}
                          {hasSizes && (
                            <div className="mt-1.5 mb-2">
                              <label className="block text-[8px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
                                Select Unit Size
                              </label>
                              <select
                                className="block w-full border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold outline-none bg-white text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                value={selectedUnitSizes[product.id] || sizes![0].size}
                                onChange={(e) => {
                                  setSelectedUnitSizes({
                                    ...selectedUnitSizes,
                                    [product.id]: e.target.value
                                  })
                                }}
                              >
                                {sizes!.map(s => (
                                  <option key={s.id} value={s.size}>
                                    {s.size} (₹{s.price})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Unit size stocks list breakdown */}
                          <div className="mb-2 text-[9px] font-semibold text-slate-455 uppercase tracking-wider">
                            {hasSizes ? (
                              <div className="space-y-1">
                                <span className="block text-[8px] text-slate-400 font-extrabold uppercase">Unit Stocks:</span>
                                <div className="flex flex-wrap gap-1 text-slate-700 font-bold">
                                  {sizes!.map(s => (
                                    <span key={s.id} className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100/50 whitespace-nowrap">
                                      {s.size}: <span className={s.quantity === 0 ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>{s.quantity}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div>
                                Stock: <span className="font-extrabold text-slate-700">{activeStock} units</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Rate & Cart action */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Rate</span>
                            <span className="text-xs font-black text-slate-950 mt-1 block">₹{activePrice.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {outOfStock ? (
                              <Badge variant="danger" className="text-[9px] px-1.5 py-0.5 font-bold">Sold Out</Badge>
                            ) : cartQty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg p-0.5 border border-emerald-250">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateCartQuantity(product.id, chosenUnitSizeName, cartQty - 1)
                                  }}
                                  className="w-6 h-6 rounded bg-white border border-slate-200 text-emerald-700 font-extrabold flex items-center justify-center hover:bg-emerald-100 transition shadow-sm active:scale-95"
                                >
                                  -
                                </button>
                                <span className="w-5 text-center text-[11px] font-black text-emerald-950 select-none">
                                  {cartQty}
                                </span>
                                <button
                                  type="button"
                                  disabled={cartQty >= activeStock}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateCartQuantity(product.id, chosenUnitSizeName, cartQty + 1)
                                  }}
                                  className="w-6 h-6 rounded bg-white border border-slate-200 text-emerald-700 font-extrabold flex items-center justify-center hover:bg-emerald-100 transition shadow-sm active:scale-95 disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(product, 1)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xs font-bold transition active:scale-[0.95] shadow-md shadow-emerald-600/10"
                              >
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right panel - Billing Engine */}
          <div className="lg:col-span-5 flex flex-col lg:h-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:overflow-hidden min-h-0">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 block">Active Stall Cart</span>

            {/* Scrollable Cart items */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-150 rounded-2xl p-6 bg-slate-50/50 mb-6">
                <span className="text-4xl block mb-2">🛒</span>
                <p className="text-xs font-bold">Stall Billing Cart is Empty.</p>
                <p className="text-xxs text-slate-400 mt-1 max-w-[200px]">Click any product on the left to add items to the customer bill.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl p-4 bg-slate-50/30 mb-6">
                {cart.map((item, idx) => (
                  <div key={`${item.product.id}-${item.unitSize}`} className="py-3 flex justify-between items-center gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-sm block truncate">
                        {item.product.name} {item.unitSize ? `(${item.unitSize})` : ''}
                      </span>
                      <span className="text-xxs text-slate-450 block font-semibold">Rate: ₹{item.price.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.unitSize, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-600 transition"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.unitSize, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-600 transition"
                      >
                        +
                      </button>
                    </div>

                    <span className="w-20 text-right text-xs font-black text-slate-950 shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-455 mb-1">
                    Customer Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-455 mb-1">
                    Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-455 mb-1">
                    Apartment Location <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    required
                    value={stallPlace}
                    onChange={(e) => setStallPlace(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none focus:border-emerald-500 font-semibold bg-white"
                  >
                    <option value="" disabled>Select Apartment</option>
                    {stallAreas.map((area: any) => (
                      <option key={area.id} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                    {stallAreas.length === 0 && (
                      <option value="" disabled>No Apartment Areas Defined</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Subtotal tallies */}
              <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 font-semibold text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Stall Produce Subtotal</span>
                  <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xxs">
                  <span>CGST (4%)</span>
                  <span className="text-slate-900 font-bold">₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xxs">
                  <span>SGST (4%)</span>
                  <span className="text-slate-900 font-bold">₹{sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-1 text-sm font-black text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-lg font-black text-emerald-800">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Process Button */}
              <Button
                type="submit"
                disabled={cart.length === 0 || checkoutLoading}
                loading={checkoutLoading}
                className="w-full py-3.5 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/10 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                🧮 Checkout
              </Button>
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
