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
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const user = session?.user
  const userRole = (user as any)?.role

  // Fetch cart items length dynamically
  useEffect(() => {
    const fetchCartCount = async () => {
      if (status === 'authenticated' && userRole === 'customer') {
        try {
          const res = await fetch('/api/cart')
          if (res.ok) {
            const data = await res.json()
            if (data && data.items) {
              const count = data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
              setCartCount(count)
            }
          }
        } catch (err) {
          console.error('Failed to fetch cart count:', err)
        }
      } else {
        // Guest user or other roles: read from localStorage
        const stored = localStorage.getItem('guestCart')
        if (stored) {
          try {
            const items = JSON.parse(stored)
            const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
            setCartCount(count)
          } catch {
            setCartCount(0)
          }
        } else {
          setCartCount(0)
        }
      }
    }

    fetchCartCount()
    // Poll cart count every 3 seconds
    const interval = setInterval(fetchCartCount, 3000)
    return () => clearInterval(interval)
  }, [status, userRole, pathname])

  // Fetch notifications
  const fetchNotifications = async () => {
    if (status !== 'authenticated') return
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    if (status === 'authenticated') {
      const interval = setInterval(fetchNotifications, 10000)
      return () => clearInterval(interval)
    }
  }, [status, pathname])

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (err) {
      console.error(err)
    }
  }

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

  const mobileNavLinkStyle = (path: string) =>
    `block text-base font-bold transition-all px-4 py-3 rounded-xl ${
      isActive(path)
        ? 'text-emerald-800 bg-emerald-50'
        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
    }`

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/85 backdrop-blur-md shadow-sm shadow-slate-100/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo & Desktop Nav Links */}
          <div className="flex flex-1 items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-emerald-800 shrink-0">
              <span className="text-2xl">🌱</span>
              <span>Sasya Khetr</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:ml-10 lg:flex lg:space-x-2">
              {status === 'unauthenticated' ? (
                <Link href="/customer/dashboard" className={navLinkStyle('/customer/dashboard')}>
                  🏠 Home
                </Link>
              ) : userRole === 'customer' ? (
                <>
                  <Link href="/customer/dashboard" className={navLinkStyle('/customer/dashboard')}>
                    🏠 Home
                  </Link>
                  <Link href="/customer/dashboard/orders" className={navLinkStyle('/customer/dashboard/orders')}>
                    📋 My Orders
                  </Link>
                  <Link href="/customer/dashboard/billing" className={navLinkStyle('/customer/dashboard/billing')}>
                    💰 Payment History
                  </Link>
                </>
              ) : userRole === 'salesperson' ? (
                <>
                  <Link href="/farmer/dashboard" className={navLinkStyle('/farmer/dashboard')}>
                    📈 Analytics
                  </Link>
                  <Link href="/farmer/dashboard/inventory" className={navLinkStyle('/farmer/dashboard/inventory')}>
                    📦 Inventory
                  </Link>
                  <Link href="/farmer/dashboard/stalls" className={navLinkStyle('/farmer/dashboard/stalls')}>
                    🎪 Stall Areas
                  </Link>
                  <Link href="/farmer/dashboard/stall-sales" className={navLinkStyle('/farmer/dashboard/stall-sales')}>
                    📊 Stall Sales
                  </Link>
                  <Link href="/farmer/dashboard/counter" className={navLinkStyle('/farmer/dashboard/counter')}>
                    🧮 Live Counter
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
                  <Link href="/farmer/dashboard/stall-sales" className={navLinkStyle('/farmer/dashboard/stall-sales')}>
                    📊 Stall Sales
                  </Link>
                  <Link href="/farmer/dashboard/credentials" className={navLinkStyle('/farmer/dashboard/credentials')}>
                    🔑 Staff Credentials
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Section Profile/Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart Icon for Customer & Guest */}
            {(status === 'unauthenticated' || userRole === 'customer') && (
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

            {/* Notification Bell */}
            {status === 'authenticated' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex items-center p-2 text-slate-500 hover:text-emerald-600 transition outline-none"
                >
                  <span className="text-xl">🔔</span>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-xxs font-bold leading-none text-white border-2 border-white animate-pulse">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-3 duration-250">
                    <div className="px-4 pb-2 border-b border-slate-50 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Notifications</span>
                      {notifications.some(n => !n.read) && (
                        <button
                          onClick={async () => {
                            try {
                              await fetch('/api/notifications', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ readAll: true })
                              })
                              fetchNotifications()
                            } catch (err) {
                              console.error(err)
                            }
                          }}
                          className="text-xxs font-bold text-emerald-600 hover:text-emerald-700 transition"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto mt-2 px-2 space-y-1">
                      {notifications.length === 0 ? (
                        <p className="text-center py-4 text-xs font-semibold text-slate-440 italic">No notifications yet</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            className={`p-2.5 rounded-xl text-left cursor-pointer transition select-none flex flex-col ${
                              n.read ? 'hover:bg-slate-50 bg-white' : 'bg-emerald-50/40 hover:bg-emerald-50/60 border-l-2 border-emerald-500 pl-2'
                            }`}
                          >
                            <span className={`text-xs font-medium ${n.read ? 'text-slate-650' : 'text-slate-900 font-bold'}`}>
                              {n.message}
                            </span>
                            <span className="text-xxs text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {status === 'authenticated' ? (
              <>
                {/* Profile Edit Shortcut Link (next to notification bell) */}
                {(userRole === 'farmer' || userRole === 'salesperson') && (
                  <Link
                    href="/farmer/dashboard/profile"
                    className={`p-2 text-slate-500 hover:text-emerald-600 transition text-lg ${
                      isActive('/farmer/dashboard/profile') ? 'text-emerald-700' : ''
                    }`}
                    title="Edit Profile"
                  >
                    👤
                  </Link>
                )}

                {userRole === 'customer' && (
                  <Link
                    href="/customer/dashboard/profile"
                    className={`p-2 text-slate-500 hover:text-emerald-600 transition text-lg ${
                      isActive('/customer/dashboard/profile') ? 'text-emerald-700' : ''
                    }`}
                    title="Edit Profile"
                  >
                    👤
                  </Link>
                )}

                {/* Profile Name Block */}
                <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-100 pl-2 sm:pl-4">
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {user?.name}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-3 py-1.5 text-xs font-bold shadow-sm transition active:scale-[0.98]"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/auth/login"
                  className="text-sm font-bold text-slate-600 hover:text-emerald-800 transition px-2 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 shadow-sm transition hover:shadow active:scale-[0.98]"
                >
                  Join Us
                </Link>
              </div>
            )}

            {/* Mobile Hamburger menu toggle button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center p-2 text-slate-550 hover:text-emerald-600 lg:hidden outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <span className="text-2xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white py-4 px-4 space-y-2 lg:hidden shadow-inner animate-in slide-in-from-top duration-200">
          {status === 'unauthenticated' ? (
            <Link
              href="/customer/dashboard"
              className={mobileNavLinkStyle('/customer/dashboard')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏠 Home
            </Link>
          ) : userRole === 'customer' ? (
            <>
              <Link
                href="/customer/dashboard"
                className={mobileNavLinkStyle('/customer/dashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link
                href="/customer/dashboard/orders"
                className={mobileNavLinkStyle('/customer/dashboard/orders')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📋 My Orders
              </Link>
              <Link
                href="/customer/dashboard/billing"
                className={mobileNavLinkStyle('/customer/dashboard/billing')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                💰 Payment History
              </Link>
            </>
          ) : userRole === 'salesperson' ? (
            <>
              <Link
                href="/farmer/dashboard"
                className={mobileNavLinkStyle('/farmer/dashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📈 Analytics
              </Link>
              <Link
                href="/farmer/dashboard/inventory"
                className={mobileNavLinkStyle('/farmer/dashboard/inventory')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📦 Inventory
              </Link>
              <Link
                href="/farmer/dashboard/stalls"
                className={mobileNavLinkStyle('/farmer/dashboard/stalls')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🎪 Stall Areas
              </Link>
              <Link
                href="/farmer/dashboard/stall-sales"
                className={mobileNavLinkStyle('/farmer/dashboard/stall-sales')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📊 Stall Sales
              </Link>
              <Link
                href="/farmer/dashboard/counter"
                className={mobileNavLinkStyle('/farmer/dashboard/counter')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🧮 Live Counter
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/farmer/dashboard"
                className={mobileNavLinkStyle('/farmer/dashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📈 Analytics
              </Link>
              <Link
                href="/farmer/dashboard/inventory"
                className={mobileNavLinkStyle('/farmer/dashboard/inventory')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📦 Inventory
              </Link>
              <Link
                href="/farmer/dashboard/orders"
                className={mobileNavLinkStyle('/farmer/dashboard/orders')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📬 Received Orders
              </Link>
              <Link
                href="/farmer/dashboard/customers"
                className={mobileNavLinkStyle('/farmer/dashboard/customers')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                👥 Customers
              </Link>
              <Link
                href="/farmer/dashboard/stall-sales"
                className={mobileNavLinkStyle('/farmer/dashboard/stall-sales')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📊 Stall Sales
              </Link>
              <Link
                href="/farmer/dashboard/credentials"
                className={mobileNavLinkStyle('/farmer/dashboard/credentials')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🔑 Staff Credentials
              </Link>
            </>
          )}

          {/* Mobile Profile Display */}
          {status === 'authenticated' && (
            <div className="pt-4 border-t border-slate-100 mt-2 flex items-center justify-between px-4">
              <span className="text-sm font-bold text-slate-800">{user?.name}</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  handleLogout()
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
