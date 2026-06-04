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

interface Product {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  category: string
  farmerId: string
}

interface CartItem {
  product: Product
  quantity: number
}

export default function LiveCounterPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deductStock, setDeductStock] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const [categories, setCategories] = useState<string[]>(Array.from(PRODUCT_CATEGORIES))

  const fetchInventory = async () => {
    if (!session?.user) return
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const allProducts = await res.json()
        const farmerProducts = allProducts.filter(
          (p: Product) => p.farmerId === (session.user as any).id
        )
        setProducts(farmerProducts)
        setFilteredProducts(farmerProducts)
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
        setCategories(data.map((c: any) => c.name))
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchInventory()
    fetchCategories()
  }, [session])

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

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id)
    const currentQtyInCart = existing ? existing.quantity : 0

    if (product.quantity <= currentQtyInCart) {
      alert(`Cannot add more. Only ${product.quantity} unit(s) left in stock.`)
      return
    }

    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const updateCartQuantity = (productId: string, newQty: number) => {
    const item = cart.find((i) => i.product.id === productId)
    if (!item) return

    if (newQty <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId))
      return
    }

    if (item.product.quantity < newQty) {
      alert(`Cannot exceed stock limits. Only ${item.product.quantity} unit(s) available.`)
      return
    }

    setCart(
      cart.map((i) => (i.product.id === productId ? { ...i, quantity: newQty } : i))
    )
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const cgst = subtotal * 0.04
  const sgst = subtotal * 0.04
  const grandTotal = subtotal + cgst + sgst

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert('Your stall billing cart is empty.')
      return
    }

    setCheckoutLoading(true)
    try {
      const transactionId = 'STALL-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      const dateStr = new Date().toLocaleString('en-IN')

      // 1. Deduct stock from backend SQLite database if selected
      if (deductStock) {
        for (const item of cart) {
          const updatedQty = item.product.quantity - item.quantity
          const res = await fetch(`/api/products/${item.product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: updatedQty })
          })
          if (!res.ok) {
            console.error(`Failed to deduct stock for product: ${item.product.name}`)
          }
        }
      }

      // 2. Generate a gorgeous printable invoice popup
      const itemsRowsHtml = cart
        .map(
          (item, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 16px; font-size: 13px;">${idx + 1}</td>
          <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #0f172a;">${item.product.name}</td>
          <td style="padding: 12px 16px; font-size: 13px; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 16px; font-size: 13px; text-align: right;">₹${item.product.price.toFixed(2)}</td>
          <td style="padding: 12px 16px; font-size: 13px; text-align: right; font-weight: 800;">₹${(item.product.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
        )
        .join('')

      const invoiceHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Stall_Memo_${transactionId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 30px 15px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02); }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .brand { color: #065f46; font-size: 24px; font-weight: 900; margin: 0 0 4px 0; }
            .subtitle { font-size: 12px; color: #64748b; margin: 0; font-weight: 600; }
            .meta { margin-top: 16px; font-size: 13px; color: #475569; display: grid; grid-template-cols: 1fr 1fr; gap: 8px; text-align: left; }
            .meta span { font-weight: 700; color: #0f172a; }
            .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; tracking-spacing: 0.1em; color: #94a3b8; margin: 24px 0 10px 0; display: block; text-align: left; }
            table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 20px; }
            th { background: #f8fafc; padding: 10px 16px; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
            .summary { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px; width: 280px; margin-left: auto; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; font-weight: 600; color: #475569; }
            .summary-row.total { border-top: 2px solid #0f172a; padding-top: 12px; margin-top: 6px; font-size: 16px; font-weight: 900; color: #0f172a; }
            .footer { border-top: 2px dashed #e2e8f0; padding-top: 20px; margin-top: 24px; text-align: center; font-size: 12px; color: #64748b; }
            .print-btn { display: block; width: 100%; max-width: 180px; margin: 0 auto 20px auto; background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; text-align: center; }
            @media print { body { background: #ffffff; padding: 0; } .container { border: none; box-shadow: none; padding: 0; } .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">🖨️ Print Memo</button>
          <div class="container">
            <div class="header">
              <h1 class="brand">🌱 Sasya Kshetra</h1>
              <p class="subtitle">PHYSICAL STALL CASH RECEIPT</p>
              <div class="meta">
                <div>Stall Bill: <span>#${transactionId}</span></div>
                <div>Date: <span>${dateStr}</span></div>
                <div>Customer: <span>${customerName || 'Walk-in Guest'}</span></div>
                <div>Phone: <span>${customerPhone || 'N/A'}</span></div>
              </div>
            </div>

            <span class="section-title">Produce Purchased</span>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Item</th>
                  <th style="text-align: center; width: 60px;">Qty</th>
                  <th style="text-align: right; width: 100px;">Rate</th>
                  <th style="text-align: right; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>Stall Subtotal</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>CGST (4%)</span>
                <span>₹${cgst.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>SGST (4%)</span>
                <span>₹${sgst.toFixed(2)}</span>
              </div>
              <div class="summary-row total">
                <span>Grand Total</span>
                <span>₹${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p style="font-weight: 700; color: #065f46; margin: 0 0 6px 0;">Paid in Full - Cash / UPI Transaction</p>
              <p style="margin: 0;">Thank you for supporting organic local farms! 🌱</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            }
          </script>
        </body>
        </html>
      `

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(invoiceHtml)
        printWindow.document.close()
      } else {
        alert('Popup blocker prevented opening the stall memo. Please enable popups.')
      }

      // 3. Clear cart and reset states
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      await fetchInventory()
      alert('Stall Transaction Completed Successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to complete checkout transaction.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col h-[calc(100vh-64px)]">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Live Counter Point of Sale</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Calculate customer bills dynamically and deduct produce inventory automatically during physical market stalls.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 flex-1 overflow-hidden min-h-0">
          {/* Left panel - Inventory Produce Selector */}
          <div className="lg:col-span-7 flex flex-col h-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm overflow-hidden min-h-0">
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
                  className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none bg-white transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
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
                <p className="text-sm font-semibold">No stock found in this category.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
                {filteredProducts.map((product) => {
                  const outOfStock = product.quantity <= 0
                  return (
                    <Card
                      key={product.id}
                      hoverEffect={!outOfStock}
                      onClick={() => !outOfStock && addToCart(product)}
                      className={`p-3 border border-slate-100 bg-white flex flex-col justify-between transition cursor-pointer select-none rounded-2xl ${
                        outOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-emerald-250 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-xl flex items-center justify-center border border-emerald-100 shrink-0 font-sans">
                          {product.category === 'Fruits' && '🍎'}
                          {product.category === 'Vegetables' && '🥦'}
                          {product.category === 'Grains' && '🌾'}
                          {product.category === 'Dairy' && '🥛'}
                          {product.category === 'Honey & Jams' && '🍯'}
                          {product.category === 'Herbs & Spices' && '🌿'}
                          {!['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Honey & Jams', 'Herbs & Spices'].includes(product.category) && '🌱'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-xs truncate" title={product.name}>{product.name}</h3>
                          <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block mt-0.5">
                            {product.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
                        <div>
                          <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Rate</span>
                          <span className="text-xs font-black text-slate-950 mt-0.5 block">₹{product.price.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {outOfStock ? (
                            <Badge variant="danger" className="text-xxs">Sold Out</Badge>
                          ) : (
                            <>
                              <div className="text-right shrink-0">
                                <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Stock</span>
                                <span className="text-xxs font-bold text-slate-700 mt-0.5 block">{product.quantity} U</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToCart(product)
                                }}
                                className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-sm font-black transition active:scale-[0.93] shadow-sm shrink-0"
                                title="Add to Stall Cart"
                              >
                                +
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right panel - Billing Engine */}
          <div className="lg:col-span-5 flex flex-col h-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm overflow-hidden min-h-0">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 block">Active Stall Cart</span>

            {/* Scrollable Cart items */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-150 rounded-2xl p-6 bg-slate-50/50 mb-6">
                <span className="text-4xl block mb-2">🛒</span>
                <p className="text-xs font-semibold">Stall Billing Cart is Empty.</p>
                <p className="text-xxs text-slate-400 mt-1 max-w-[200px]">Click any product on the left to add items to the walk-in customer bill.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl p-4 bg-slate-50/30 mb-6">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-3 flex justify-between items-center gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-sm block truncate">{item.product.name}</span>
                      <span className="text-xxs text-slate-450 block font-semibold">Rate: ₹{item.product.price.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-600 transition"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-600 transition"
                      >
                        +
                      </button>
                    </div>

                    <span className="w-20 text-right text-xs font-black text-slate-950 shrink-0">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Walk-in Customer credentials Form */}
            <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Customer Name (Optional)"
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full"
                />
                <Input
                  label="Mobile Number (Optional)"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Deduct Stock toggle options */}
              <div className="flex items-center gap-2 py-1.5 select-none">
                <input
                  id="deduct-checkbox"
                  type="checkbox"
                  checked={deductStock}
                  onChange={(e) => setDeductStock(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition cursor-pointer"
                />
                <label htmlFor="deduct-checkbox" className="text-xxs font-bold uppercase tracking-wider text-slate-450 cursor-pointer">
                  Sync Database Inventory (Deduct Sold Stock)
                </label>
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
                🧮 Check Out Stall Sale
              </Button>
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
