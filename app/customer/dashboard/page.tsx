'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
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
  image?: string
  farmerId: string
  farmer?: {
    name: string
  }
}

export default function CustomerDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Custom Categories and Reviews states
  const [categories, setCategories] = useState<string[]>(Array.from(PRODUCT_CATEGORIES))
  const [activeReviewProduct, setActiveReviewProduct] = useState<any | null>(null)
  const [userRating, setUserRating] = useState<number>(5)
  const [userComment, setUserComment] = useState<string>('')
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category && category !== 'All') params.append('category', category)
      if (search) params.append('search', search)
      if (sort) params.append('sort', sort)

      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
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
    fetchCategories()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts()
    }, 300) // Debounce search changes

    return () => clearTimeout(delayDebounce)
  }, [search, category, sort])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeReviewProduct) return
    setReviewSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: activeReviewProduct.id,
          rating: userRating,
          comment: userComment
        })
      })

      const data = await res.json()
      if (res.ok) {
        setUserComment('')
        setUserRating(5)
        await fetchProducts()
        const updatedProductRes = await fetch(`/api/products/${activeReviewProduct.id}`)
        if (updatedProductRes.ok) {
          const updatedProduct = await updatedProductRes.json()
          setActiveReviewProduct(updatedProduct)
        }
      } else {
        alert(data.error || 'Failed to submit review')
      }
    } catch (err) {
      console.error('Review submit error:', err)
      alert('An error occurred while submitting your review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleAddToCart = async (productId: string) => {
    setAddingId(productId)
    setToastMessage(null)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      })

      if (res.ok) {
        const product = products.find(p => p.id === productId)
        setToastMessage(`Added ${product?.name} to your shopping cart! 🛒`)
        setTimeout(() => setToastMessage(null), 3000)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add item to cart')
      }
    } catch (err) {
      console.error('Cart add error:', err)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Navbar />
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-xl flex items-center gap-3 border border-slate-800 animate-slide-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        {/* Banner Section */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-700 px-8 py-12 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-9xl -mr-10 -mt-10 select-none">🥦</div>
          <div className="max-w-2xl relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Fresh, Direct & Healthy</h1>
            <p className="mt-3 text-lg text-emerald-100 font-medium">
              Connect directly with local organic farmers. Fresh harvests delivered straight to your table.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/40">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search fresh vegetables, fruits, dairy..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-950 placeholder-slate-400 outline-none text-sm font-medium transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort selection */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sort By:</span>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none bg-slate-50 transition focus:border-emerald-500"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">Latest Harvest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category tags row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
          <button
            onClick={() => setCategory('All')}
            className={`px-4 py-2 text-sm font-bold rounded-full border transition-all ${
              category === 'All'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10'
                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
            }`}
          >
            All Produce
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 text-sm font-bold rounded-full border whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10'
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 animate-pulse">
                <div className="w-full h-44 bg-slate-100 rounded-xl"></div>
                <div className="h-6 bg-slate-100 rounded w-2/3"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 bg-slate-100 rounded w-1/4"></div>
                  <div className="h-9 bg-slate-100 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-5xl block mb-4">🧺</span>
            <h3 className="text-lg font-bold text-slate-900">No Fresh Produce Found</h3>
            <p className="text-sm text-slate-500 mt-1 px-4">
              Farmers are harvesting new batches. Try broadening your query or checking other categories.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((prod) => (
              <Card key={prod.id} className="flex flex-col h-full bg-white relative overflow-hidden group">
                {/* Category indicator label */}
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="info" className="opacity-90">
                    {prod.category}
                  </Badge>
                </div>

                {/* Stock Warning Badge */}
                {prod.quantity === 0 ? (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="danger">Sold Out</Badge>
                  </div>
                ) : prod.quantity <= 5 ? (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="warning">Only {prod.quantity} Left</Badge>
                  </div>
                ) : null}

                {/* Image Placeholder */}
                <div className="w-full h-44 bg-emerald-50/50 rounded-2xl flex items-center justify-center text-5xl mb-4 select-none transition group-hover:scale-[1.02]">
                  {prod.category === 'Fruits' && '🍎'}
                  {prod.category === 'Vegetables' && '🥦'}
                  {prod.category === 'Grains' && '🌾'}
                  {prod.category === 'Dairy' && '🥛'}
                  {prod.category === 'Honey & Jams' && '🍯'}
                  {prod.category === 'Herbs & Spices' && '🌿'}
                  {!['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Honey & Jams', 'Herbs & Spices'].includes(prod.category) && '🌱'}
                </div>

                <div className="flex-1 flex flex-col">
                  <span className="text-xxs font-extrabold tracking-wider uppercase text-emerald-600 block mb-1">
                    👨‍🌾 {prod.farmer?.name || 'Local Farmer'}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-1 mb-1">
                    {prod.name}
                  </h3>

                  {/* Reviews Star Rating Badge */}
                  <div className="flex items-center gap-1 mb-2">
                    {(() => {
                      const reviews = (prod as any).reviews || []
                      const count = reviews.length
                      const avg = count
                        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / count).toFixed(1)
                        : null
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReviewProduct(prod)
                            setUserRating(5)
                            setUserComment('')
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 transition bg-amber-50/50 hover:bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/55"
                        >
                          <span>⭐</span>
                          <span className="text-slate-800">{avg ? `${avg} / 5` : 'No reviews'}</span>
                          <span className="text-slate-400 font-medium">({count} review{count !== 1 ? 's' : ''})</span>
                        </button>
                      )
                    })()}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium">
                    {prod.description}
                  </p>

                  <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-50">
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block">Unit Price</span>
                      <span className="text-lg font-black text-slate-900">₹{prod.price.toFixed(2)}</span>
                    </div>

                    <Button
                      variant={prod.quantity === 0 ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={prod.quantity === 0}
                      loading={addingId === prod.id}
                      onClick={() => handleAddToCart(prod.id)}
                    >
                      {prod.quantity === 0 ? 'Sold Out' : 'Add to Cart'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Product Reviews Modal */}
        {activeReviewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 truncate max-w-[280px]">
                    Reviews for {activeReviewProduct.name}
                  </h3>
                  <span className="text-xxs font-extrabold uppercase tracking-wider text-emerald-600 block mt-0.5">
                    👨‍🌾 Sold by {activeReviewProduct.farmer?.name || 'Local Farmer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReviewProduct(null)}
                  className="text-slate-450 hover:text-slate-600 font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
                {/* Rating summary */}
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  {(() => {
                    const reviews = activeReviewProduct.reviews || []
                    const count = reviews.length
                    const avg = count
                      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / count).toFixed(1)
                      : null
                    return (
                      <>
                        <div className="text-center bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm shrink-0">
                          <span className="text-3xl font-black text-slate-900 block leading-none">{avg || 'N/A'}</span>
                          <span className="text-xxs font-bold text-slate-400 uppercase mt-1.5 block">Average</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-amber-500 text-lg">
                            {avg ? (
                              <>
                                {'★'.repeat(Math.round(Number(avg)))}{'☆'.repeat(5 - Math.round(Number(avg)))}
                              </>
                            ) : (
                              '☆☆☆☆☆'
                            )}
                          </div>
                          <p className="text-xs text-slate-505 font-semibold mt-1">
                            Based on {count} review{count !== 1 ? 's' : ''} from verified customers.
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Submit review form */}
                <div className="border-t border-b border-slate-100 py-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">Submit or Update Your Review</h4>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Your Rating (out of 5)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setUserRating(stars)}
                            className="text-2xl transition hover:scale-110 active:scale-95"
                          >
                            <span className={userRating >= stars ? 'text-amber-500' : 'text-slate-200'}>
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400">
                        Your Comment
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Share your experience with this organic product..."
                        className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={reviewSubmitting}
                        loading={reviewSubmitting}
                        size="sm"
                      >
                        Publish Review
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                    Reviews List ({activeReviewProduct.reviews?.length || 0})
                  </span>
                  {(!activeReviewProduct.reviews || activeReviewProduct.reviews.length === 0) ? (
                    <p className="text-sm text-slate-450 italic font-medium py-4 text-center">No reviews submitted yet. Write the first review above!</p>
                  ) : (
                    <div className="space-y-3">
                      {activeReviewProduct.reviews.map((rev: any) => (
                        <div key={rev.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">{rev.user?.name || 'Customer'}</span>
                              <span className="text-xxs text-slate-400 font-medium">
                                {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="text-amber-500 text-sm font-black">
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </div>
                          </div>
                          <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveReviewProduct(null)}
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
