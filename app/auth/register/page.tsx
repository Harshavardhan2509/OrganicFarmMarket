'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'farmer'>('customer')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Secret query parameter check to show the farmer role option
  const showFarmerOption = searchParams.get('role') === 'farmer' || searchParams.get('farmer') === 'true'

  useEffect(() => {
    if (showFarmerOption) {
      setRole('farmer')
    } else {
      setRole('customer')
    }
  }, [showFarmerOption])

  // Redirect if already logged in
  if (session?.user) {
    const userRole = (session.user as any).role
    router.push(userRole === 'farmer' ? '/farmer/dashboard' : '/customer/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, phone, address }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      // Automatically redirect to login upon successful registration
      router.push('/auth/login?registered=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-md border border-slate-100">
        <div className="text-center">
          <span className="inline-block text-4xl mb-2">🌱</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Join the fresh produce revolution today
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Role selection tab - ONLY visible if showFarmerOption is true */}
          {showFarmerOption && (
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                I want to join as a:
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  className={`py-2 px-4 rounded-md text-sm font-semibold transition ${
                    role === 'customer'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                  onClick={() => setRole('customer')}
                >
                  🛍️ Customer
                </button>
                <button
                  type="button"
                  className={`py-2 px-4 rounded-md text-sm font-semibold transition ${
                    role === 'farmer'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                  onClick={() => setRole('farmer')}
                >
                  👨‍🌾 Farmer
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition"
                placeholder="Password (minimum 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="phone" className="sr-only">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition"
                placeholder="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="address" className="sr-only">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition"
                placeholder={role === 'farmer' ? 'Farm Address (Optional)' : 'Delivery Address (Optional)'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-slate-500">Already have an account? </span>
            <Link
              href="/auth/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition"
            >
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
