'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      const userRole = (session.user as any).role
      if (userRole === 'farmer') {
        router.push('/farmer/dashboard')
      } else if (userRole === 'salesperson') {
        router.push('/farmer/dashboard/counter')
      } else {
        router.push('/customer/dashboard')
      }
    }
  }, [session, router])

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully! Please sign in using your credentials.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false
      })

      if (result?.error) {
        throw new Error(result.error || 'Invalid credentials')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-md border border-slate-100">
        <div className="text-center">
          <span className="inline-block text-4xl mb-2">🌱</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-semibold">
            Access your Sasya Khetr dashboard
          </p>
        </div>

        {success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-xs text-emerald-800 font-bold leading-relaxed">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-xs text-rose-600 font-bold">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Email Address <span className="text-rose-500 font-black ml-1">^</span>
              </label>
              <input
                id="email"
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
                  className="relative block w-full rounded-lg border border-slate-200 pl-4 pr-12 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition"
                  placeholder="Enter password"
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
                'Sign In'
              )}
            </button>
          </div>

          <div className="text-center text-sm font-semibold">
            <span className="text-slate-500 font-medium">Don't have an account? </span>
            <Link
              href="/auth/register"
              className="font-bold text-emerald-600 hover:text-emerald-700 transition"
            >
              Join Us
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
