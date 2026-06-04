'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

interface Product {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  category: string
  farmerId: string
}

export default function InventoryPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Category management states
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const fetchInventory = async () => {
    if (!session?.user) return
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const allProducts = await res.json()
        // Filter products created by this farmer
        const farmerProducts = allProducts.filter(
          (p: Product) => p.farmerId === (session.user as any).id
        )
        setProducts(farmerProducts)
      }
    } catch (err) {
      console.error('Failed to load inventory:', err)
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
      console.error('Failed to load categories:', err)
    }
  }

  useEffect(() => {
    fetchInventory()
    fetchCategories()
  }, [session])

  const handleDelete = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${productName} from your inventory?`)) return
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchInventory()
      } else {
        alert('Failed to delete product')
      }
    } catch (err) {
      console.error('Delete product error:', err)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryError(null)
    if (!newCategoryName.trim()) return

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      })

      const data = await res.json()
      if (res.ok) {
        setNewCategoryName('')
        fetchCategories()
      } else {
        setCategoryError(data.error || 'Failed to add category')
      }
    } catch (err) {
      setCategoryError('An error occurred while adding category')
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (name.toLowerCase() === 'other') {
      alert('Cannot delete the "Other" category')
      return
    }
    if (!window.confirm(`Are you sure you want to delete the category "${name}"? Any products in this category will be reassigned to "Other".`)) return

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (res.ok) {
        fetchCategories()
        fetchInventory()
      } else {
        alert(data.error || 'Failed to delete category')
      }
    } catch (err) {
      console.error('Delete category error:', err)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Inventory</h1>
            <p className="text-sm text-slate-500 font-medium">Keep track of stock levels, category listings, and unit prices</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCategoryError(null)
                setShowCategoryModal(true)
              }}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-bold transition shadow-sm active:scale-[0.98]"
            >
              📂 Manage Categories
            </button>
            <Link href="/farmer/dashboard/inventory/new">
              <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-md shadow-emerald-600/10 hover:shadow active:scale-[0.98]">
                ➕ Add New Product
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-5xl block mb-4">🚜</span>
            <h3 className="text-lg font-bold text-slate-900">Your Inventory is Empty</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6 px-4">
              Add your organic vegetables, fresh fruits, grains, or dairy to start receiving orders!
            </p>
            <Link href="/farmer/dashboard/inventory/new">
              <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-md shadow-emerald-600/10 hover:shadow">
                Create First Product
              </button>
            </Link>
          </div>
        ) : (
          <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
            <Table headers={['Product Details', 'Category', 'Unit Price', 'Stock Level', 'Actions']}>
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl border border-emerald-100">
                        {prod.category === 'Fruits' && '🍎'}
                        {prod.category === 'Vegetables' && '🥦'}
                        {prod.category === 'Grains' && '🌾'}
                        {prod.category === 'Dairy' && '🥛'}
                        {prod.category === 'Honey & Jams' && '🍯'}
                        {prod.category === 'Herbs & Spices' && '🌿'}
                        {prod.category === 'Meat' && '🥩'}
                        {!['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Honey & Jams', 'Herbs & Spices', 'Meat'].includes(prod.category) && '🌱'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{prod.name}</span>
                        <span className="text-xxs font-mono uppercase text-slate-400">ID: {prod.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info">
                      {prod.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-950">
                    ₹{prod.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${prod.quantity === 0 ? 'text-rose-600' : prod.quantity <= 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {prod.quantity}
                      </span>
                      {prod.quantity === 0 ? (
                        <Badge variant="danger" className="text-xxs">Out of Stock</Badge>
                      ) : prod.quantity <= 5 ? (
                        <Badge variant="warning" className="text-xxs">Low Stock</Badge>
                      ) : (
                        <Badge variant="success" className="text-xxs">Available</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/farmer/dashboard/inventory/${prod.id}`}>
                        <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                          Edit
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(prod.id, prod.name)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        )}

        {/* Category Management Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Manage Product Categories</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Add Category Form */}
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="New Category Name (e.g. Berries)"
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md shadow-emerald-600/10 hover:shadow"
                  >
                    Add
                  </button>
                </form>

                {categoryError && (
                  <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-semibold">
                    {categoryError}
                  </div>
                )}

                {/* Category List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                    Existing Categories
                  </span>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800"
                    >
                      <span>{cat.name}</span>
                      {cat.name.toLowerCase() !== 'other' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">
                          System Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition"
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

