'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    router.push(userRole === 'farmer' ? '/farmer/dashboard' : userRole === 'salesperson' ? '/farmer/dashboard/counter' : '/customer/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is mandatory')
      return
    }
    if (!email.trim()) {
      setError('Email is mandatory')
      return
    }
    if (!phone.trim()) {
      setError('Mobile number is mandatory')
      return
    }
    if (!address.trim()) {
      setError('Address is mandatory')
      return
    }
    if (!password.trim()) {
      setError('Password is mandatory')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          role,
          phone: phone.trim(),
          address: address.trim() || undefined
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

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
          <p className="mt-2 text-sm text-slate-500 font-semibold">
            Join Sasya Khetr today
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-xs text-rose-600 font-bold">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {showFarmerOption && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Join as a <span className="text-rose-500 font-black ml-1">^</span>
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  className={`py-2 px-4 rounded-md text-xs font-bold transition capitalize ${
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
                  className={`py-2 px-4 rounded-md text-xs font-bold transition capitalize ${
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
              <label htmlFor="name" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Full Name <span className="text-rose-500 font-black ml-1">^</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email-address" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Email Address <span className="text-rose-500 font-black ml-1">^</span>
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition"
                placeholder="e.g. name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Password <span className="text-rose-500 font-black ml-1">^</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="relative block w-full rounded-lg border border-slate-200 pl-4 pr-12 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition animate-input"
                  placeholder="Password (minimum 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 focus:outline-none z-20"
                >
                  {showPassword ? '👁️ Hide' : '👁️ Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Confirm Password <span className="text-rose-500 font-black ml-1">^</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="relative block w-full rounded-lg border border-slate-200 pl-4 pr-12 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition animate-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 focus:outline-none z-20"
                >
                  {showConfirmPassword ? '👁️ Hide' : '👁️ Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Mobile Number <span className="text-rose-500 font-black ml-1">^</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-2">
                Delivery Address <span className="text-rose-500 font-bold ml-1">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition"
                placeholder={role === 'farmer' ? 'Farm Address' : 'Delivery Address'}
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

          <div className="text-center text-sm font-semibold">
            <span className="text-slate-500 font-medium">Already have an account? </span>
            <Link
              href="/auth/login"
              className="font-bold text-emerald-600 hover:text-emerald-700 transition"
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
