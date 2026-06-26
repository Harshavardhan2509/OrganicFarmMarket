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
  unitSizes?: string | null
  image?: string | null
  upcomingStock?: string | null
}

export default function InventoryPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const isSalesperson = session?.user && (session.user as any).role === 'salesperson'

  // Category management states
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryCgst, setNewCategoryCgst] = useState('0')
  const [newCategorySgst, setNewCategorySgst] = useState('0')
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // Edit category states
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryCgst, setEditCategoryCgst] = useState('0')
  const [editCategorySgst, setEditCategorySgst] = useState('0')

  const fetchInventory = async () => {
    if (!session?.user) return
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const allProducts = await res.json()
        const userRole = (session.user as any).role
        if (userRole === 'farmer') {
          // Filter products created by this farmer
          const farmerProducts = allProducts.filter(
            (p: Product) => p.farmerId === (session.user as any).id
          )
          setProducts(farmerProducts)
        } else {
          // Salesperson views all products in the system
          setProducts(allProducts)
        }
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

  useEffect(() => {
    if (showCategoryModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showCategoryModal])

  const handleDelete = async (productId: string, productName: string) => {
    if (isSalesperson) return
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
    if (isSalesperson) return
    setCategoryError(null)
    if (!newCategoryName.trim()) return

    const cgstVal = parseFloat(newCategoryCgst)
    const sgstVal = parseFloat(newCategorySgst)
    if (isNaN(cgstVal) || cgstVal < 0 || isNaN(sgstVal) || sgstVal < 0) {
      setCategoryError('CGST and SGST must be valid non-negative numbers')
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          cgst: cgstVal,
          sgst: sgstVal
        })
      })

      const data = await res.json()
      if (res.ok) {
        setNewCategoryName('')
        setNewCategoryCgst('0')
        setNewCategorySgst('0')
        fetchCategories()
      } else {
        setCategoryError(data.error || 'Failed to add category')
      }
    } catch (err) {
      setCategoryError('An error occurred while adding category')
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSalesperson || !editingCategory) return
    setCategoryError(null)
    if (!editCategoryName.trim()) return

    const cgstVal = parseFloat(editCategoryCgst)
    const sgstVal = parseFloat(editCategorySgst)
    if (isNaN(cgstVal) || cgstVal < 0 || isNaN(sgstVal) || sgstVal < 0) {
      setCategoryError('CGST and SGST must be valid non-negative numbers')
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editCategoryName.trim(),
          cgst: cgstVal,
          sgst: sgstVal
        })
      })

      const data = await res.json()
      if (res.ok) {
        setEditingCategory(null)
        setEditCategoryName('')
        setEditCategoryCgst('0')
        setEditCategorySgst('0')
        fetchCategories()
        fetchInventory()
      } else {
        setCategoryError(data.error || 'Failed to update category')
      }
    } catch (err) {
      setCategoryError('An error occurred while updating category')
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (isSalesperson) return
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
    <ProtectedRoute allowedRoles={['farmer', 'salesperson']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Inventory</h1>
            <p className="text-sm text-slate-500 font-medium">Keep track of stock levels, category listings, and unit prices</p>
          </div>
          {!isSalesperson && (
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
          )}
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
            {!isSalesperson && (
              <Link href="/farmer/dashboard/inventory/new">
                <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-md shadow-emerald-600/10 hover:shadow">
                  Create First Product
                </button>
              </Link>
            )}
          </div>
        ) : (
          <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
            {/* Desktop / Tablet view */}
            <div className="hidden md:block">
              <Table headers={isSalesperson ? ['Product Details', 'Category', 'Unit Price', 'Stock Level'] : ['Product Details', 'Category', 'Unit Price', 'Stock Level', 'Actions']}>
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl border border-emerald-100 overflow-hidden shrink-0">
                          {(() => {
                            if (!prod.image) return null;
                            let displayImg = prod.image;
                            if (prod.image.startsWith('[')) {
                              try {
                                const parsed = JSON.parse(prod.image);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                  displayImg = parsed[0];
                                }
                              } catch {}
                            }
                            return displayImg ? (
                              <img src={displayImg} alt={prod.name} className="w-full h-full object-cover" />
                            ) : null;
                          })()}
                          {!prod.image && (
                            <>
                              {prod.category === 'Fruits' && '🍎'}
                              {prod.category === 'Vegetables' && '🥦'}
                              {prod.category === 'Grains' && '🌾'}
                              {prod.category === 'Dairy' && '🥛'}
                              {prod.category === 'Honey & Jams' && '🍯'}
                              {prod.category === 'Herbs & Spices' && '🌿'}
                              {prod.category === 'Meat' && '🥩'}
                              {!['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Honey & Jams', 'Herbs & Spices', 'Meat'].includes(prod.category) && '🌱'}
                            </>
                          )}
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
                    <td className="px-6 py-4 text-sm font-black text-slate-955">
                      {(() => {
                        let sizes: any[] = []
                        if (prod.unitSizes) {
                          try {
                            sizes = JSON.parse(prod.unitSizes)
                          } catch {}
                        }
                        if (sizes && sizes.length > 0) {
                          return (
                            <div className="space-y-1.5 text-xs font-semibold">
                              {sizes.map((s: any) => (
                                <div key={s.id} className="flex items-center gap-1.5">
                                  <span className="text-slate-450 font-bold">{s.size}:</span>
                                  <span className="text-slate-900 font-black">₹{parseFloat(s.price).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )
                        }
                        return `₹${prod.price.toFixed(2)}`
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        let sizes: any[] = []
                        if (prod.unitSizes) {
                          try {
                            sizes = JSON.parse(prod.unitSizes)
                          } catch {}
                        }
                        if (sizes && sizes.length > 0) {
                          return (
                            <div className="space-y-1.5 text-xs font-semibold">
                              {sizes.map((s: any) => (
                                <div key={s.id} className="flex items-center gap-1.5">
                                  <span className="text-slate-500 font-bold">{s.size}:</span>
                                  <span className={`font-black ${s.quantity === 0 ? 'text-rose-600' : s.quantity <= 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                                    {s.quantity}
                                  </span>
                                  {s.quantity === 0 ? (
                                    <Badge variant="danger" className="text-[9px] px-1 py-0 font-extrabold uppercase">Out</Badge>
                                  ) : s.quantity <= 5 ? (
                                    <Badge variant="warning" className="text-[9px] px-1 py-0 font-extrabold uppercase">Low</Badge>
                                  ) : (
                                    <Badge variant="success" className="text-[9px] px-1 py-0 font-extrabold uppercase">OK</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        }
                        return (
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
                        )
                      })()}
                    </td>
                    {!isSalesperson && (
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
                    )}
                  </tr>
                ))}
              </Table>
            </div>

            {/* Mobile Card list view */}
            <div className="block md:hidden space-y-4">
              {products.map((prod) => {
                let sizes: any[] = []
                if (prod.unitSizes) {
                  try {
                    sizes = JSON.parse(prod.unitSizes)
                  } catch {}
                }
                const hasSizes = sizes && sizes.length > 0
                return (
                  <div key={prod.id} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 font-semibold text-xs relative">
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl border border-emerald-100 overflow-hidden shrink-0">
                          {(() => {
                            if (!prod.image) return null;
                            let displayImg = prod.image;
                            if (prod.image.startsWith('[')) {
                              try {
                                const parsed = JSON.parse(prod.image);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                  displayImg = parsed[0];
                                }
                              } catch {}
                            }
                            return displayImg ? (
                              <img src={displayImg} alt={prod.name} className="w-full h-full object-cover" />
                            ) : null;
                          })()}
                          {!prod.image && (
                            <>
                              {prod.category === 'Fruits' && '🍎'}
                              {prod.category === 'Vegetables' && '🥦'}
                              {prod.category === 'Grains' && '🌾'}
                              {prod.category === 'Dairy' && '🥛'}
                              {prod.category === 'Honey & Jams' && '🍯'}
                              {prod.category === 'Herbs & Spices' && '🌿'}
                              {prod.category === 'Meat' && '🥩'}
                              {!['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Honey & Jams', 'Herbs & Spices', 'Meat'].includes(prod.category) && '🌱'}
                            </>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{prod.name}</span>
                          <span className="text-xxs font-mono uppercase text-slate-400">ID: {prod.id}</span>
                        </div>
                      </div>
                      <Badge variant="info">{prod.category}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">Unit Price</span>
                        <span className="text-xs font-black text-slate-955">
                          {hasSizes ? (
                            <div className="space-y-1">
                              {sizes.map((s: any) => (
                                <div key={s.id} className="flex items-center gap-1">
                                  <span className="text-slate-450 text-[10px]">{s.size}:</span>
                                  <span>₹{parseFloat(s.price).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            `₹${prod.price.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">Stock Level</span>
                        <span className="text-xs font-black">
                          {hasSizes ? (
                            <div className="space-y-1">
                              {sizes.map((s: any) => (
                                <div key={s.id} className="flex items-center gap-1">
                                  <span className="text-slate-505 text-[10px]">{s.size}:</span>
                                  <span className={s.quantity === 0 ? 'text-rose-600' : s.quantity <= 5 ? 'text-amber-600' : 'text-slate-900'}>
                                    {s.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={prod.quantity === 0 ? 'text-rose-600' : prod.quantity <= 5 ? 'text-amber-600' : 'text-slate-900'}>
                                {prod.quantity}
                              </span>
                              {prod.quantity === 0 ? (
                                <Badge variant="danger" className="text-[9px] px-1 py-0 font-extrabold uppercase">Out</Badge>
                              ) : prod.quantity <= 5 ? (
                                <Badge variant="warning" className="text-[9px] px-1 py-0 font-extrabold uppercase">Low</Badge>
                              ) : null}
                            </div>
                          )}
                        </span>
                      </div>
                    </div>

                    {!isSalesperson && (
                      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                        <Link href={`/farmer/dashboard/inventory/${prod.id}`} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-750 transition"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Category Management Modal */}
        {showCategoryModal && !isSalesperson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-900">Manage Product Categories</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
                {editingCategory ? (
                  /* Edit Category Form */
                  <form onSubmit={handleEditCategory} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">Editing Category: {editingCategory.name}</span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Category Name"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none bg-white font-semibold"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">CGST (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none bg-white font-semibold"
                            value={editCategoryCgst}
                            onChange={(e) => setEditCategoryCgst(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">SGST (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-950 outline-none bg-white font-semibold"
                            value={editCategorySgst}
                            onChange={(e) => setEditCategorySgst(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="px-3 py-1.5 bg-slate-250 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Add Category Form */
                  <form onSubmit={handleAddCategory} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">Add New Category</span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Category Name (e.g. Berries)"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-950 outline-none bg-white font-semibold"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">CGST (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-955 outline-none bg-white font-semibold"
                            value={newCategoryCgst}
                            onChange={(e) => setNewCategoryCgst(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">SGST (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-955 outline-none bg-white font-semibold"
                            value={newCategorySgst}
                            onChange={(e) => setNewCategorySgst(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/10"
                    >
                      + Create Category
                    </button>
                  </form>
                )}

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
                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 gap-2"
                    >
                      <div className="flex flex-col">
                        <span>{cat.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          CGST: {cat.cgst || 0}% | SGST: {cat.sgst || 0}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        {cat.name.toLowerCase() !== 'other' && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat)
                              setEditCategoryName(cat.name)
                              setEditCategoryCgst((cat.cgst || 0).toString())
                              setEditCategorySgst((cat.sgst || 0).toString())
                            }}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
                          >
                            Edit
                          </button>
                        )}
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
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
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
