'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface Product {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  category: string
  image?: string | null
  farmerId: string
  farmer?: {
    name: string
    email: string
    phone?: string
  }
  unitSizes?: string | null
  upcomingStock?: string | null
  reviews: Array<{
    id: string
    rating: number
    comment: string
    createdAt: string
    user: {
      name: string
    }
  }>
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSizeName, setSelectedSizeName] = useState<string>('')
  
  const [userRating, setUserRating] = useState<number>(0) // Default to 0 stars (no pre-selection)
  const [userComment, setUserComment] = useState<string>('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [productImages, setProductImages] = useState<string[]>([])
  const [activeImage, setActiveImage] = useState<string>('')


  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}`)
      if (!res.ok) {
        throw new Error('Product not found')
      }
      const data = await res.json()
      setProduct(data)
      
      let imgList: string[] = []
      if (data.image) {
        if (data.image.startsWith('[')) {
          try {
            imgList = JSON.parse(data.image) as string[]
          } catch {
            imgList = [data.image]
          }
        } else {
          imgList = [data.image]
        }
      }
      setProductImages(imgList)
      if (imgList.length > 0) {
        setActiveImage(imgList[0])
      }
      
      // Select default unit size if any
      if (data.unitSizes) {
        try {
          const sizes = JSON.parse(data.unitSizes)
          if (sizes.length > 0) {
            setSelectedSizeName(sizes[0].size)
          }
        } catch {}
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCartItems = async () => {
    if (status === 'authenticated') {
      try {
        const res = await fetch('/api/cart')
        if (res.ok) {
          const data = await res.json()
          if (data && data.items) {
            setCartItems(data.items)
          }
        }
      } catch (err) {
        console.error('Failed to fetch cart items:', err)
      }
    } else {
      const stored = localStorage.getItem('guestCart')
      if (stored) {
        try {
          setCartItems(JSON.parse(stored))
        } catch {
          setCartItems([])
        }
      } else {
        setCartItems([])
      }
    }
  }

  useEffect(() => {
    if (status !== 'loading') {
      fetchCartItems()
    }
  }, [status])

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const updateCartQuantity = async (productId: string, unitSize: string | null, newQty: number) => {
    if (!product) return
    setAdding(true)
    setToastMessage(null)

    if (status === 'unauthenticated') {
      const guestCartJson = localStorage.getItem('guestCart') || '[]'
      let guestCart = []
      try {
        guestCart = JSON.parse(guestCartJson)
      } catch {}

      const index = guestCart.findIndex((item: any) => item.productId === productId && item.unitSize === unitSize)
      if (newQty <= 0) {
        if (index !== -1) {
          guestCart.splice(index, 1)
        }
        setToastMessage(`Removed ${product.name} from guest cart! 🛒`)
      } else {
        if (newQty > displayedStock) {
          alert('Requested quantity exceeds available stock')
          setAdding(false)
          return
        }

        if (index !== -1) {
          guestCart[index].quantity = newQty
        } else {
          guestCart.push({ productId, quantity: newQty, unitSize })
        }
        setToastMessage(`Updated ${product.name} quantity in guest cart! 🛒`)
      }
      localStorage.setItem('guestCart', JSON.stringify(guestCart))
      setCartItems(guestCart)
      setTimeout(() => setToastMessage(null), 3000)
      setAdding(false)
      return
    }

    try {
      if (newQty <= 0) {
        const res = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, unitSize }),
        })
        if (res.ok) {
          setToastMessage(`Removed ${product.name} from cart! 🛒`)
          setTimeout(() => setToastMessage(null), 3000)
          await fetchCartItems()
        } else {
          const data = await res.json()
          alert(data.error || 'Failed to update cart')
        }
      } else {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity: newQty, unitSize, relative: false }),
        })
        if (res.ok) {
          setToastMessage(`Updated ${product.name} quantity! 🛒`)
          setTimeout(() => setToastMessage(null), 3000)
          await fetchCartItems()
        } else {
          const data = await res.json()
          alert(data.error || 'Failed to update cart')
        }
      }
    } catch (err) {
      console.error('Cart update error:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    const chosenSize = selectedSizeName || null
    await updateCartQuantity(product.id, chosenSize, 1)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    if (status === 'unauthenticated') {
      alert('Please sign in to submit a review.')
      router.push('/auth/login')
      return
    }

    if (userRating === 0) {
      alert('Please select a star rating between 1 and 5.')
      return
    }

    setReviewSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: userRating,
          comment: userComment
        })
      })

      const data = await res.json()
      if (res.ok) {
        setUserComment('')
        setUserRating(0) // Reset to 0 stars
        setToastMessage('Review published successfully! ⭐')
        setTimeout(() => setToastMessage(null), 3000)
        fetchProduct()
      } else {
        alert(data.error || 'Failed to submit review')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to publish review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer']} allowGuest>
        <Navbar />
        <div className="flex h-[80vh] w-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-sm font-medium text-slate-500 animate-pulse">Loading product details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!product) {
    return (
      <ProtectedRoute allowedRoles={['customer']} allowGuest>
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-lg text-center space-y-6">
            <span className="text-6xl block">⚠️</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Not Found</h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              The product you are looking for does not exist or has been removed from our listings.
            </p>
            <Link href="/customer/dashboard">
              <Button>Browse All Produce</Button>
            </Link>
          </div>
        </main>
      </ProtectedRoute>
    )
  }

  let sizes: any[] = []
  if (product.unitSizes) {
    try {
      sizes = JSON.parse(product.unitSizes)
    } catch {}
  }
  const hasSizes = sizes && sizes.length > 0
  const chosenSizeObj = hasSizes ? sizes.find(s => s.size === selectedSizeName) : null
  const displayedPrice = chosenSizeObj ? chosenSizeObj.price : product.price
  const displayedStock = chosenSizeObj ? chosenSizeObj.quantity : product.quantity
  const isSoldOut = displayedStock === 0
  const isLowStock = displayedStock > 0 && displayedStock <= 5

  const reviewsCount = product.reviews?.length || 0
  const averageRating = reviewsCount
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
    : null

  return (
    <ProtectedRoute allowedRoles={['customer']} allowGuest>
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-xl flex items-center gap-3 border border-slate-800 animate-slide-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/customer/dashboard" className="hover:text-emerald-700 transition">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="text-slate-500 font-extrabold uppercase">{product.category}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Product Info Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm mb-8">
          {/* Left Side: Image container and thumbnails */}
          <div className="flex flex-col gap-4">
            <div className="w-full aspect-video md:aspect-square bg-emerald-50/30 rounded-2xl flex items-center justify-center text-8xl select-none border border-slate-100 overflow-hidden relative shadow-inner">
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="info" className="px-3 py-1 font-bold text-xs uppercase tracking-wider shadow">
                  {product.category}
                </Badge>
              </div>
              {isSoldOut ? (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="danger" className="px-3 py-1 font-bold text-xs shadow">Sold Out</Badge>
                </div>
              ) : isLowStock ? (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="warning" className="px-3 py-1 font-bold text-xs shadow">Only {displayedStock} Left</Badge>
                </div>
              ) : null}

              {activeImage ? (
                <img src={activeImage} alt={product.name} className="w-full h-full object-cover transition-all" />
              ) : (
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

            {/* Thumbnail list selector */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {productImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                      activeImage === imgUrl ? 'border-emerald-600 shadow-md' : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Details panel */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating stars aggregate info */}
              <div className="flex items-center gap-2 mt-4 pb-4 border-b border-slate-100">
                <div className="flex items-center text-amber-500 text-base font-black">
                  {averageRating ? '★'.repeat(Math.round(Number(averageRating))) + '☆'.repeat(5 - Math.round(Number(averageRating))) : '☆☆☆☆☆'}
                </div>
                <span className="text-sm font-black text-slate-800">{averageRating ? `${averageRating} / 5` : 'No reviews'}</span>
                <span className="text-xs text-slate-400 font-semibold">({reviewsCount} customer review{reviewsCount !== 1 ? 's' : ''})</span>
              </div>

              {/* Description */}
              <div className="py-6">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Detailed Description</h3>
                <p className="text-sm text-slate-650 font-medium leading-relaxed">
                  {product.description || 'No detailed description provided by the farmer. This chemical-free organic harvest is locally grown with care.'}
                </p>
              </div>

              {/* Upcoming Stock Banner */}
              {product.upcomingStock && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center gap-3 animate-pulse">
                  <span className="text-xl">📅</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Upcoming stock planned!</h4>
                    <p className="text-[11px] text-amber-700 font-medium mt-0.5">Availability information: {product.upcomingStock}</p>
                  </div>
                </div>
              )}

              {/* Unit Size selectors */}
              {hasSizes && (
                <div className="mb-6">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Select Size Option</span>
                  <div className="flex flex-wrap gap-2.5">
                    {sizes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSizeName(s.size)}
                        className={`px-4 py-2.5 text-xs font-bold border rounded-xl transition ${
                          selectedSizeName === s.size
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block">{s.size}</span>
                        <span className={`block text-[10px] mt-0.5 ${selectedSizeName === s.size ? 'text-emerald-100' : 'text-slate-400'}`}>
                          ₹{parseFloat(s.price).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price, Stock and Cart CTA actions */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-6 mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Price Per Unit</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">₹{displayedPrice.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Stock Status</span>
                  <span className={`text-sm font-bold block mt-1 ${isSoldOut ? 'text-rose-600' : 'text-slate-900'}`}>
                    {isSoldOut ? 'Sold Out' : `${displayedStock} units available`}
                  </span>
                </div>
              </div>

              {isSoldOut ? (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 py-3 text-sm font-extrabold rounded-xl"
                    variant="secondary"
                    disabled
                  >
                    Sold Out
                  </Button>
                </div>
              ) : (() => {
                const cartItem = cartItems.find((item: any) => item.productId === product.id && item.unitSize === (selectedSizeName || null))
                const currentQty = cartItem ? cartItem.quantity : 0

                if (currentQty > 0) {
                  return (
                    <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-2 border border-emerald-250 w-full">
                      <button
                        type="button"
                        disabled={adding}
                        onClick={() => updateCartQuantity(product.id, selectedSizeName || null, currentQty - 1)}
                        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-emerald-100 text-emerald-700 font-extrabold text-lg rounded-lg shadow-sm border border-emerald-100 active:scale-95 transition-all select-none disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="px-4 font-black text-base text-emerald-950 select-none text-center">
                        {adding ? '...' : `${currentQty} in Cart`}
                      </span>
                      <button
                        type="button"
                        disabled={adding || currentQty >= displayedStock}
                        onClick={() => updateCartQuantity(product.id, selectedSizeName || null, currentQty + 1)}
                        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-emerald-100 text-emerald-700 font-extrabold text-lg rounded-lg shadow-sm border border-emerald-100 active:scale-95 transition-all select-none disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  )
                }

                return (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 py-3 text-sm font-extrabold rounded-xl"
                      variant="primary"
                      loading={adding}
                      onClick={handleAddToCart}
                    >
                      🛒 Add to Shopping Cart
                    </Button>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm">
          {/* Write a review column */}
          <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8">
            <h3 className="text-lg font-black text-slate-900 mb-4">Customer Sentiment</h3>
            
            {/* Aggregate Score card */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6 flex items-center gap-4">
              <div className="text-center bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm shrink-0">
                <span className="text-3xl font-black text-slate-900 block leading-none">{averageRating || 'N/A'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 block">Average</span>
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-500 text-lg">
                  {averageRating ? '★'.repeat(Math.round(Number(averageRating))) + '☆'.repeat(5 - Math.round(Number(averageRating))) : '☆☆☆☆☆'}
                </div>
                <p className="text-xxs text-slate-450 font-bold mt-1 uppercase tracking-wide">
                  Based on {reviewsCount} review{reviewsCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Review Form */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Submit or Update Your Review</h4>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
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

                <Button
                  type="submit"
                  disabled={reviewSubmitting}
                  loading={reviewSubmitting}
                  size="sm"
                  className="w-full"
                >
                  Publish Review
                </Button>
              </form>
            </div>
          </div>

          {/* Reviews list column */}
          <div className="lg:col-span-2 lg:pl-4 space-y-4 max-h-[500px] overflow-y-auto pr-1">
            <h3 className="text-lg font-black text-slate-900 mb-2">Verified Reviews ({reviewsCount})</h3>
            
            {(!product.reviews || product.reviews.length === 0) ? (
              <p className="text-sm text-slate-450 italic font-medium py-12 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                No reviews submitted yet. Write the first review above!
              </p>
            ) : (
              <div className="space-y-3.5">
                {product.reviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{rev.user?.name || 'Customer'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
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
      </main>
    </ProtectedRoute>
  )
}
