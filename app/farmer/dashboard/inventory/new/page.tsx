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

export default function AddProductPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState<string>('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<string[]>(Array.from(PRODUCT_CATEGORIES))

  const router = useRouter()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          const catNames = data.map((c: any) => c.name)
          setCategories(catNames)
          if (catNames.length > 0) {
            setCategory(catNames[0])
          }
        } else {
          setCategory(PRODUCT_CATEGORIES[0])
        }
      } catch (err) {
        console.error(err)
        setCategory(PRODUCT_CATEGORIES[0])
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          quantity: parseInt(quantity),
          category,
          image
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
          <Link href="/farmer/dashboard/inventory" className="text-slate-400 hover:text-emerald-700 transition">
            ⬅️ Inventory
          </Link>
          <span className="text-slate-350">/</span>
          <span className="text-sm font-bold text-slate-800">Add New Product</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Harvest Entry</h1>

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
                placeholder="e.g., 4.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <Input
                label="Available Stock"
                type="number"
                min="1"
                required
                placeholder="e.g., 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">
                Product Description
              </label>
              <textarea
                required
                rows={4}
                className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                placeholder="Detail product qualities, size, organic certification details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Input
              label="Optional Image URL"
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
