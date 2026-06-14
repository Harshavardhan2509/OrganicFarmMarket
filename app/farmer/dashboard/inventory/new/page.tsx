'use client'

import React, { useState, useEffect } from 'react'
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

export default function AddProductPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Product Unit Sizes state
  const [unitSizes, setUnitSizes] = useState<UnitSizeItem[]>([
    { id: '1', size: '1 Unit', price: '', quantity: '' }
  ])

  const [categories, setCategories] = useState<any[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setImage(data.url)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to upload image')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('An error occurred during file upload.')
    } finally {
      setUploadingImage(false)
    }
  }

  const router = useRouter()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
          if (data.length > 0) {
            setCategory(data[0].name)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchCategories()
  }, [])

  const handleAddUnitSize = () => {
    const nextId = Math.random().toString(36).substring(2, 9)
    setUnitSizes([...unitSizes, { id: nextId, size: '', price: '', quantity: '' }])
  }

  const handleRemoveUnitSize = (id: string) => {
    if (unitSizes.length === 1) return
    setUnitSizes(unitSizes.filter((u) => u.id !== id))
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

    setLoading(true)

    try {
      const parsedUnitSizes = unitSizes.map((u) => ({
        id: u.id,
        size: u.size.trim(),
        price: parseFloat(u.price),
        quantity: parseInt(u.quantity)
      }))

      // Primary price is the first size's price, total quantity is the sum
      const primaryPrice = parsedUnitSizes[0].price
      const totalQuantity = parsedUnitSizes.reduce((sum, u) => sum + u.quantity, 0)

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: primaryPrice,
          quantity: totalQuantity,
          category,
          image,
          unitSizes: JSON.stringify(parsedUnitSizes)
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/farmer/dashboard/inventory')
      } else {
        throw new Error(data.error || 'Failed to add product')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/farmer/dashboard/inventory" className="text-slate-400 hover:text-emerald-700 transition font-bold">
            ⬅️ Inventory
          </Link>
          <span className="text-slate-350">/</span>
          <span className="text-sm font-bold text-slate-800">Add New Product</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Harvest Entry</h1>

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
                  placeholder="e.g., Moringa Powder, Vine Tomatoes"
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
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
                Define the available unit sizes (e.g. 100grm, 500grm, 1kg) along with their corresponding prices and stock.
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
                        className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none focus:border-emerald-500 font-semibold"
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
                        className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none focus:border-emerald-500 font-semibold"
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
                        className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none focus:border-emerald-500 font-semibold"
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
                placeholder="Detail product qualities, size, organic certification details..."
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
              <Button type="submit" loading={loading}>
                Publish Product
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </ProtectedRoute>
  )
}
