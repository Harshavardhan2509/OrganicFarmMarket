'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)

  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      setError('Mobile number is required')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setSuccess('Verification OTP sent successfully! (Check otp-debug.log locally)')
      // Since it's a simulated SMS system, let's inform user in development mode
      setDebugOtp('Simulated OTP has been written to the backend otp-debug.log file.')
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 65 characters')
      setError('Password must be at least 6 characters')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess('Your password has been successfully reset! Redirecting to login...')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-md border border-slate-100">
        <div className="text-center">
          <span className="inline-block text-4xl mb-2">🔑</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-semibold">
            {step === 1 ? 'Enter your mobile number to get verified' : 'Enter verification code and your new password'}
          </p>
        </div>

        {success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-xs text-emerald-800 font-bold leading-relaxed">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-xs text-rose-600 font-bold leading-relaxed">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Mobile Number <span className="text-rose-500 font-black ml-1">*</span>
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
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Send Verification OTP'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                  Verification OTP <span className="text-rose-500 font-black ml-1">*</span>
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition"
                  placeholder="Enter 6-digit OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {debugOtp && (
                  <span className="text-[10px] text-amber-600 block mt-1.5 font-bold">
                    ℹ️ Note: OTP is written to <code>otp-debug.log</code> in the project root folder.
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                  New Password <span className="text-rose-500 font-black ml-1">*</span>
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                  Confirm New Password <span className="text-rose-500 font-black ml-1">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="relative block w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 placeholder-slate-400 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold transition"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm font-semibold border-t border-slate-100 pt-4">
          <Link
            href="/auth/login"
            className="font-bold text-emerald-600 hover:text-emerald-700 transition"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
