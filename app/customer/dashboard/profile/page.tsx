'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CustomerProfilePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile')
      if (res.ok) {
        const data = await res.json()
        setName(data.name || '')
        setEmail(data.email || '')
        setPhone(data.phone || '')
        setAddress(data.address || '')
        setProfileImage(data.profileImage || '')
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('Could not retrieve profile information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUpdating(true)

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, profileImage }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Profile updated successfully! 👤')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">My Profile</h1>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-4xl shadow-sm border border-emerald-100 select-none">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      ;(e.target as any).style.display = 'none'
                    }}
                  />
                ) : (
                  '👤'
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-4">{name}</h2>
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                Customer Account
              </span>
            </div>

            {success && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800 font-semibold mb-6">
                {success}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600 font-semibold mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Email Address"
                  disabled
                  value={email}
                  className="bg-slate-50 cursor-not-allowed opacity-75 font-semibold text-slate-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <Input
                  label="Avatar Image URL"
                  type="url"
                  placeholder="Enter profile image URL"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                />
              </div>

              <Input
                label="Delivery Address"
                placeholder="Enter default shipping destination"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <Button type="submit" loading={updating}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </ProtectedRoute>
  )
}
