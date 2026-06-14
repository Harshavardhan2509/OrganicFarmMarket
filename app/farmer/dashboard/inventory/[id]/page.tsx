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

interface UnitSizeItem {
  id: string
  size: string
  price: string
  quantity: string
}

export default function EditProductPage({
  params
}: {
  params: { id: string }
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 2MB to keep database size reasonable
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size exceeds 2MB limit. Please choose a smaller image.')
      return
    }

    setUploadingImage(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result as string)
      setUploadingImage(false)
    }
    reader.onerror = () => {
      alert('Failed to read file.')
      setUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  // Custom Category and Stock states
  const [categories, setCategories] = useState<any[]>([])
  const [stockHistory, setStockHistory] = useState<any[]>([])
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockAction, setStockAction] = useState<'add' | 'remove' | 'set' | 'damage'>('add')
  const [stockValue, setStockValue] = useState('')
  const [stockReason, setStockReason] = useState('')
  const [stockUpdating, setStockUpdating] = useState(false)

  // Product Unit Sizes state
  const [unitSizes, setUnitSizes] = useState<UnitSizeItem[]>([])
  const [selectedUnitSizeId, setSelectedUnitSizeId] = useState('')

  const router = useRouter()

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setName(data.name || '')
        setDescription(data.description || '')
        setCategory(data.category || '')
        setImage(data.image || '')
        setStockHistory(data.stockHistory || [])

        if (data.unitSizes) {
          try {
            const parsed = JSON.parse(data.unitSizes) as any[]
            const formatted = parsed.map(p => ({
              id: p.id,
              size: p.size,
              price: (p.basePrice !== undefined ? p.basePrice : p.price).toString(),
              quantity: p.quantity.toString()
            }))
            setUnitSizes(formatted)
            if (formatted.length > 0) {
              setSelectedUnitSizeId(formatted[0].id)
            }
          } catch {
            const basePriceVal = data.basePrice !== undefined ? data.basePrice : data.price
            const defUnit = [{ id: 'default', size: '1 Unit', price: basePriceVal.toString(), quantity: data.quantity.toString() }]
            setUnitSizes(defUnit)
            setSelectedUnitSizeId('default')
          }
        } else {
          const basePriceVal = data.basePrice !== undefined ? data.basePrice : data.price
          const defUnit = [{ id: 'default', size: '1 Unit', price: basePriceVal.toString(), quantity: data.quantity.toString() }]
          setUnitSizes(defUnit)
          setSelectedUnitSizeId('default')
        }
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
        setCategories(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchProduct()
    fetchCategories()
  }, [params.id])

  const handleAddUnitSize = () => {
    const nextId = Math.random().toString(36).substring(2, 9)
    setUnitSizes([...unitSizes, { id: nextId, size: '', price: '', quantity: '' }])
  }

  const handleRemoveUnitSize = (id: string) => {
    if (unitSizes.length === 1) return
    setUnitSizes(unitSizes.filter((u) => u.id !== id))
    if (selectedUnitSizeId === id) {
      setSelectedUnitSizeId(unitSizes.filter((u) => u.id !== id)[0].id)
    }
  }

  const handleUnitSizeChange = (id: string, field: keyof UnitSizeItem, value: string) => {
    setUnitSizes(unitSizes.map((u) => (u.id === id ? { ...u, [field]: value } : u)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate unit sizes
    for (const u of unitSizes) {
      if (!u.size.trim() || !u.price || !u.quantity) {
        setError('All unit size options must have valid sizes, prices, and stock quantities.')
        return
      }
      if (parseFloat(u.price) <= 0 || parseInt(u.quantity) < 0) {
        setError('Price must be greater than 0 and stock cannot be negative.')
        return
      }
    }

    setUpdating(true)

    try {
      const parsedUnitSizes = unitSizes.map((u) => ({
        id: u.id,
        size: u.size.trim(),
        price: parseFloat(u.price),
        quantity: parseInt(u.quantity)
      }))

      // Primary price is the first size's price, total quantity is the sum
      const primaryPrice = parsedUnitSizes[0].price

      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: primaryPrice,
          category,
          image,
          unitSizes: JSON.stringify(parsedUnitSizes)
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
            reason: stockReason,
            unitSizeId: selectedUnitSizeId
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

  // Calculate total stock for display
  const totalStockDisplay = unitSizes.reduce((sum, u) => sum + (parseInt(u.quantity) || 0), 0)

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/farmer/dashboard/inventory" className="text-slate-400 hover:text-emerald-700 transition font-bold">
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
                <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-xs text-rose-600 font-bold mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Product Name <span className="text-rose-500 font-black ml-1">^</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Moringa Powder"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="w-full space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Category <span className="text-rose-500 font-black ml-1">^</span>
                    </label>
                    <select
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none bg-white transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                      Display Price (₹)
                    </label>
                    <div className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-400 bg-slate-50 font-bold leading-normal">
                      ₹{(() => {
                        const pVal = parseFloat(unitSizes[0]?.price || '0')
                        const selectedCatObj = categories.find(c => c.name === category)
                        const cgstRate = selectedCatObj ? selectedCatObj.cgst || 0 : 0
                        const sgstRate = selectedCatObj ? selectedCatObj.sgst || 0 : 0
                        const totalGstRate = cgstRate + sgstRate
                        return isNaN(pVal) ? '0.00' : Math.round(pVal * (1 + totalGstRate / 100))
                      })()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                      Available Stock
                    </label>
                    <div className="flex gap-2">
                      <div className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 bg-slate-50 font-bold leading-normal">
                        {totalStockDisplay} Units Total
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

                {/* Multiple Unit Sizes Manager */}
                <div className="border-t border-b border-slate-100 py-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-slate-550 uppercase tracking-wider">
                      Product Unit Size Configurations <span className="text-rose-500 font-black ml-1">^</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddUnitSize}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-[0.97]"
                    >
                      ➕ Add Unit Size Option
                    </button>
                  </div>
                  <p className="text-xxs text-slate-400 font-medium">
                    Adjust the configuration settings below. Modifying these entries will recalculate display values.
                  </p>

                  <div className="space-y-2">
                    {unitSizes.map((u) => (
                      <div key={u.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50/50 p-3 border border-slate-100 rounded-xl w-full">
                        <div className="col-span-1 sm:col-span-6">
                          <input
                            type="text"
                            required
                            placeholder="Size (e.g. 100grm)"
                            value={u.size}
                            onChange={(e) => handleUnitSizeChange(u.id, 'size', e.target.value)}
                            className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-955 outline-none focus:border-emerald-505 font-semibold"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="Price (₹)"
                            value={u.price}
                            onChange={(e) => handleUnitSizeChange(u.id, 'price', e.target.value)}
                            className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-955 outline-none focus:border-emerald-505 font-semibold"
                          />
                          {(() => {
                            const selectedCatObj = categories.find(c => c.name === category)
                            const cgstRate = selectedCatObj ? selectedCatObj.cgst || 0 : 0
                            const sgstRate = selectedCatObj ? selectedCatObj.sgst || 0 : 0
                            const totalGstRate = cgstRate + sgstRate
                            return u.price && !isNaN(parseFloat(u.price)) ? (
                              <span className="text-[10px] text-emerald-650 font-bold block mt-1 leading-none">
                                Final: ₹{Math.round(parseFloat(u.price) * (1 + totalGstRate / 100))} (Inc. GST)
                              </span>
                            ) : null
                          })()}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="Stock"
                            value={u.quantity}
                            onChange={(e) => handleUnitSizeChange(u.id, 'quantity', e.target.value)}
                            className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-955 outline-none focus:border-emerald-505 font-semibold"
                          />
                        </div>
                        {unitSizes.length > 1 && (
                          <div className="col-span-1 sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveUnitSize(u.id)}
                              className="text-rose-650 hover:text-rose-700 font-bold text-xs px-2 py-1 hover:bg-rose-50 rounded-lg transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Product Description <span className="text-rose-500 font-black ml-1">^</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                    Product Image (Upload Local File)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                    {/* Visual Image Preview */}
                    <div className="w-24 h-24 bg-white border border-slate-150 rounded-xl flex items-center justify-center text-4xl overflow-hidden shrink-0 shadow-inner">
                      {image ? (
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        '🌱'
                      )}
                    </div>
                    
                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        id="product-image-file"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="product-image-file"
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold cursor-pointer transition select-none disabled:opacity-50"
                      >
                        {uploadingImage ? 'Uploading Image...' : '📁 Choose File from Local Storage'}
                      </label>
                      <p className="text-xxs text-slate-400 font-medium">
                        Upload PNG, JPG, or WEBP. Max size 5MB.
                      </p>
                      
                      {image && (
                        <div className="flex items-center gap-2">
                          <span className="text-xxs font-mono text-slate-450 truncate max-w-[200px]">{image}</span>
                          <button
                            type="button"
                            onClick={() => setImage('')}
                            className="text-xxs text-rose-600 hover:text-rose-700 font-bold transition"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
                                  history.action === 'damage' ? 'bg-amber-50 text-amber-705 border border-amber-200' :
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
                  {/* Unit Size Selection */}
                  {unitSizes.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Select Unit Size Option <span className="text-rose-500 font-bold ml-0.5">^</span>
                      </label>
                      <select
                        className="block w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold outline-none bg-white text-slate-950 focus:border-emerald-500"
                        value={selectedUnitSizeId}
                        onChange={(e) => setSelectedUnitSizeId(e.target.value)}
                      >
                        {unitSizes.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.size} (Current: {u.quantity} Units)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Adjustment Action <span className="text-rose-500 font-bold ml-0.5">^</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['add', 'remove', 'set', 'damage'] as const).map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setStockAction(act)}
                          className={`py-2 px-1 text-xxs font-bold rounded-lg border capitalize transition ${
                            stockAction === act
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {act === 'add' && '➕ Add'}
                          {act === 'remove' && '➖ Remove'}
                          {act === 'set' && '🎯 Set'}
                          {act === 'damage' && '⚠️ Damage'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Quantity Amount <span className="text-rose-500 font-bold ml-0.5">^</span>
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
