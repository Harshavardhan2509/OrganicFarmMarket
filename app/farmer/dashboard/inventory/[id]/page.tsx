'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PRODUCT_CATEGORIES } from '@/config/constants'

export default function EditProductPage({
  params
}: {
  params: { id: string }
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom Category and Stock states
  const [categories, setCategories] = useState<string[]>(Array.from(PRODUCT_CATEGORIES))
  const [stockHistory, setStockHistory] = useState<any[]>([])
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockAction, setStockAction] = useState<'add' | 'remove' | 'set'>('add')
  const [stockValue, setStockValue] = useState('')
  const [stockReason, setStockReason] = useState('')
  const [stockUpdating, setStockUpdating] = useState(false)

  const router = useRouter()

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setName(data.name || '')
        setDescription(data.description || '')
        setPrice(data.price.toString() || '')
        setQuantity(data.quantity.toString() || '')
        setCategory(data.category || '')
        setImage(data.image || '')
        setStockHistory(data.stockHistory || [])
      } else {
        setError('Failed to load product details.')
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err)
      setError('An error occurred while fetching product details.')
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
    fetchProduct()
    fetchCategories()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUpdating(true)

    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          category,
          image
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/farmer/dashboard/inventory')
      } else {
        throw new Error(data.error || 'Failed to update product')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStockUpdating(true)

    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockUpdate: {
            action: stockAction,
            value: parseInt(stockValue),
            reason: stockReason
          }
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setShowStockModal(false)
        setStockValue('')
        setStockReason('')
        fetchProduct()
      } else {
        throw new Error(data.error || 'Failed to update stock')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setStockUpdating(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/farmer/dashboard/inventory" className="text-slate-400 hover:text-emerald-700 transition">
            ⬅️ Inventory
          </Link>
          <span className="text-slate-350">/</span>
          <span className="text-sm font-bold text-slate-800">Edit Product</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Edit Product Details</h1>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-8">
              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600 font-semibold mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Product Name"
                    required
                    placeholder="e.g., Organic Honey, Vine Tomatoes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <div className="w-full space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">
                      Category
                    </label>
                    <select
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none bg-white transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Unit Price (₹)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">
                      Available Stock
                    </label>
                    <div className="flex gap-2">
                      <div className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 bg-slate-50 font-bold leading-normal">
                        {quantity} Units
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStockModal(true)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs whitespace-nowrap transition active:scale-[0.98] shadow-sm"
                      >
                        ✏️ Update Stock
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    Product Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Input
                  label="Image URL"
                  type="url"
                  placeholder="https://example.com/spinach.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />

                <div className="pt-4 border-t border-slate-50 flex justify-end gap-3">
                  <Link href="/farmer/dashboard/inventory">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" loading={updating}>
                    Save Product
                  </Button>
                </div>
              </form>
            </Card>

            {/* Stock Update History */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Stock Update History</h2>
              <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
                {stockHistory.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6 font-medium">No stock update history recorded for this product.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead>
                        <tr className="text-left font-bold text-slate-400 text-xxs uppercase tracking-wider">
                          <th className="pb-3 pr-4">Date & Time</th>
                          <th className="pb-3 px-4">Action</th>
                          <th className="pb-3 px-4 text-center">Change</th>
                          <th className="pb-3 px-4 text-center">Final Stock</th>
                          <th className="pb-3 pl-4">Reason / Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                        {stockHistory.map((history: any) => {
                          const isPositive = history.change > 0
                          const isZero = history.change === 0
                          return (
                            <tr key={history.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 pr-4 text-slate-500 font-medium text-xs">
                                {new Date(history.createdAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </td>
                              <td className="py-3 px-4 capitalize text-xs">
                                <span className={`px-2 py-0.5 rounded-full text-xxs font-black ${
                                  history.action === 'add' ? 'bg-emerald-50 text-emerald-700' :
                                  history.action === 'remove' ? 'bg-rose-50 text-rose-700' :
                                  'bg-indigo-50 text-indigo-700'
                                }`}>
                                  {history.action}
                                </span>
                              </td>
                              <td className={`py-3 px-4 text-center text-xs font-black ${
                                isPositive ? 'text-emerald-600' : isZero ? 'text-slate-400' : 'text-rose-600'
                              }`}>
                                {isPositive ? `+${history.change}` : history.change}
                              </td>
                              <td className="py-3 px-4 text-center text-xs text-slate-900 font-black">
                                {history.newQuantity}
                              </td>
                              <td className="py-3 pl-4 text-slate-600 text-xs font-medium max-w-[200px] truncate" title={history.reason}>
                                {history.reason || 'Manual Update'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {/* Stock Update Modal */}
        {showStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Update Stock Quantity</h3>
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleStockUpdate}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Adjustment Action
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['add', 'remove', 'set'] as const).map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setStockAction(act)}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border capitalize transition ${
                            stockAction === act
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {act === 'add' && '➕ Add'}
                          {act === 'remove' && '➖ Remove'}
                          {act === 'set' && '🎯 Set'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Quantity Amount
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 10"
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-medium"
                      value={stockValue}
                      onChange={(e) => setStockValue(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Reason for Change (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Restock from harvest, Damaged goods"
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-medium"
                      value={stockReason}
                      onChange={(e) => setStockReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stockUpdating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-md shadow-emerald-600/10"
                  >
                    {stockUpdating ? 'Applying...' : 'Apply Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
