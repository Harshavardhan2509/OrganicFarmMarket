'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)

  const user = session?.user
  const userRole = (user as any)?.role

  // Fetch cart items length dynamically if user is a customer
  useEffect(() => {
    if (status !== 'authenticated' || userRole !== 'customer') return

    const fetchCartCount = async () => {
      try {
        const res = await fetch('/api/cart')
        if (res.ok) {
          const data = await res.ok ? await res.json() : null
          if (data && data.items) {
            const count = data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
            setCartCount(count)
          }
        }
      } catch (err) {
        console.error('Failed to fetch cart count:', err)
      }
    }

    fetchCartCount()
    // Poll every 10 seconds to keep it updated or whenever path changes (like checkout/adding to cart)
    const interval = setInterval(fetchCartCount, 10000)
    return () => clearInterval(interval)
  }, [status, userRole, pathname])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  const isActive = (path: string) => pathname === path

  const navLinkStyle = (path: string) =>
    `text-sm font-semibold tracking-wide transition-all ${
      isActive(path)
        ? 'text-emerald-700 font-extrabold bg-emerald-50/50 px-3 py-2 rounded-lg'
        : 'text-slate-600 hover:text-emerald-750 px-3 py-2 hover:bg-slate-50 rounded-lg'
    }`

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/85 backdrop-blur-md shadow-sm shadow-slate-100/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex flex-1 items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-emerald-800">
              <span className="text-2xl">🌱</span>
              <span>Sasya Kshetra</span>
            </Link>

            {/* Role specific navigation tabs */}
            {status === 'authenticated' && (
              <div className="hidden md:ml-10 md:flex md:space-x-2">
                {userRole === 'customer' ? (
                  <>
                    <Link href="/customer/dashboard" className={navLinkStyle('/customer/dashboard')}>
                      🛍️ Marketplace
                    </Link>
                    <Link href="/customer/dashboard/orders" className={navLinkStyle('/customer/dashboard/orders')}>
                      📋 My Orders
                    </Link>
                    <Link href="/customer/dashboard/billing" className={navLinkStyle('/customer/dashboard/billing')}>
                      💰 Billing Logs
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/farmer/dashboard" className={navLinkStyle('/farmer/dashboard')}>
                      📈 Analytics
                    </Link>
                    <Link href="/farmer/dashboard/inventory" className={navLinkStyle('/farmer/dashboard/inventory')}>
                      📦 Inventory
                    </Link>
                    <Link href="/farmer/dashboard/orders" className={navLinkStyle('/farmer/dashboard/orders')}>
                      📬 Received Orders
                    </Link>
                    <Link href="/farmer/dashboard/customers" className={navLinkStyle('/farmer/dashboard/customers')}>
                      👥 Customers
                    </Link>
                    <Link href="/farmer/dashboard/counter" className={navLinkStyle('/farmer/dashboard/counter')}>
                      🧮 Live Counter
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right section details */}
          <div className="flex items-center gap-4">
            {status === 'authenticated' ? (
              <>
                {/* Cart badge icon for customers */}
                {userRole === 'customer' && (
                  <Link
                    href="/customer/dashboard/cart"
                    className="relative flex items-center p-2 text-slate-500 hover:text-emerald-600 transition"
                  >
                    <span className="text-xl">🛒</span>
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold leading-none text-white border-2 border-white animate-bounce">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Profile Link */}
                {userRole === 'customer' && (
                  <Link
                    href="/customer/dashboard/profile"
                    className={`text-sm font-semibold transition px-3 py-2 rounded-lg ${
                      isActive('/customer/dashboard/profile')
                        ? 'text-emerald-700 bg-emerald-50/50'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    👤 Profile
                  </Link>
                )}

                {/* User menu and Logout */}
                <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400">
                      {userRole === 'farmer' ? '👨‍🌾 Farmer' : '🛍️ Customer'}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-3.5 py-1.5 text-xs font-bold shadow-sm transition active:scale-[0.98]"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-sm font-bold text-slate-600 hover:text-emerald-800 transition px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 shadow-sm transition hover:shadow active:scale-[0.98]"
                >
                  Join Us
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
