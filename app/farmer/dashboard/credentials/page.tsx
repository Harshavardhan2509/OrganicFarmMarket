'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Table from '@/components/ui/Table'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface StaffMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  role: 'farmer' | 'salesperson'
  createdAt: string
}

export default function FarmerCredentialsPage() {
  const { data: session } = useSession()
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'farmer' | 'salesperson'>('salesperson')
  const [address, setAddress] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Edit Modal fields
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState<'farmer' | 'salesperson'>('salesperson')
  const [editAddress, setEditAddress] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editConfirmPassword, setEditConfirmPassword] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/farmer/credentials')
      if (res.ok) {
        const data = await res.json()
        setStaffList(data)
      }
    } catch (err) {
      console.error('Failed to load credentials list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !phone.trim() || !role) {
      setError('Name, Email, Password, Confirm Password, Mobile Number, and Role are mandatory fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)

    try {
      const res = await fetch('/api/farmer/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          phone: phone.trim(),
          role,
          address: address.trim() || undefined
        })
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(`Successfully created credentials for ${name}!`)
        setName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setPhone('')
        setAddress('')
        setRole('salesperson')
        setShowPassword(false)
        setShowConfirmPassword(false)
        fetchStaff()
      } else {
        throw new Error(data.error || 'Failed to create credentials')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff)
    setEditName(staff.name)
    setEditEmail(staff.email || '')
    setEditPhone(staff.phone || '')
    setEditRole(staff.role)
    setEditAddress(staff.address || '')
    setEditPassword('')
    setEditConfirmPassword('')
    setShowEditPassword(false)
    setShowEditConfirmPassword(false)
    setEditError(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim() || !editRole) {
      setEditError('Name, Email, Mobile Number, and Role are mandatory.')
      return
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('Password must be at least 6 characters.')
      return
    }
    if (editPassword !== editConfirmPassword) {
      setEditError('Passwords do not match.')
      return
    }
    setEditSubmitting(true)

    try {
      const res = await fetch(`/api/farmer/credentials/${editingStaff?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.toLowerCase().trim(),
          phone: editPhone.trim(),
          role: editRole,
          address: editAddress.trim() || null,
          password: editPassword || undefined
        })
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(`Successfully updated credentials for ${editName}!`)
        setEditingStaff(null)
        fetchStaff()
      } else {
        throw new Error(data.error || 'Failed to update credentials')
      }
    } catch (err: any) {
      setEditError(err.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete credentials for ${name}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/farmer/credentials/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Successfully deleted credentials for ${name}.`)
        fetchStaff()
      } else {
        alert(data.error || 'Failed to delete credentials')
      }
    } catch (err: any) {
      console.error('Delete error:', err)
      alert('Failed to delete credentials due to an error.')
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Credentials</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Create and manage secure credentials for Farmers/Owners and Sales Persons. Staff log in using their email and password.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Create Credentials Form */}
          <div className="lg:col-span-4">
            <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 border-b border-slate-50 pb-2">
                Create Credentials
              </h2>

              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-bold mb-4 leading-relaxed">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800 font-bold mb-4 leading-relaxed">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Name <span className="text-rose-500 font-black ml-1">^</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ram Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Email Address <span className="text-rose-500 font-black ml-1">^</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ram@sasyakhetr.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Password <span className="text-rose-500 font-black ml-1">^</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 pl-4 pr-12 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 focus:outline-none"
                    >
                      {showPassword ? '👁️ Hide' : '👁️ Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Confirm Password <span className="text-rose-500 font-black ml-1">^</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 pl-4 pr-12 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 focus:outline-none"
                    >
                      {showConfirmPassword ? '👁️ Hide' : '👁️ Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Mobile Number <span className="text-rose-500 font-black ml-1">^</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Role <span className="text-rose-500 font-black ml-1">^</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-md text-xs font-bold transition capitalize ${
                        role === 'salesperson'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                      onClick={() => setRole('salesperson')}
                    >
                      💼 Sales Person
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-md text-xs font-bold transition capitalize ${
                        role === 'farmer'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                      onClick={() => setRole('farmer')}
                    >
                      👨‍🌾 Farmer/Owner
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Address details (Optional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                  />
                </div>

                <Button type="submit" loading={submitting} className="w-full py-2.5 text-sm font-bold">
                  Generate Credentials
                </Button>
              </form>
            </Card>
          </div>

          {/* Credentials Directory */}
          <div className="lg:col-span-8">
            <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 border-b border-slate-50 pb-2">
                Active Staff Personnel
              </h2>

              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : staffList.length === 0 ? (
                <p className="text-center py-8 text-sm font-semibold text-slate-450 italic">No staff credentials have been created yet.</p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table headers={['Name', 'Email', 'Mobile Number', 'Role', 'Address', 'Created Date', 'Actions']}>
                      {staffList.map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4 font-bold text-slate-900">{staff.name}</td>
                          <td className="px-6 py-4 text-slate-800 font-semibold">
                            {staff.email || <span className="text-slate-400 italic">No Email</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-semibold">
                            {staff.phone || <span className="text-slate-400 italic">No Phone</span>}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={staff.role === 'farmer' ? 'primary' : 'info'} className="capitalize">
                              {staff.role === 'farmer' ? 'Farmer/Owner' : 'Sales Person'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-650 max-w-xs truncate" title={staff.address || ''}>
                            {staff.address || <span className="text-slate-400 italic">Not Provided</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-450 font-semibold">
                            {new Date(staff.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(staff)}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded transition"
                              >
                                ✏️ Edit
                              </button>
                              {session?.user && (session.user as any).id !== staff.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(staff.id, staff.name)}
                                  className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded transition"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-4">
                    {staffList.map((staff) => (
                      <div key={staff.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900 text-sm">{staff.name}</span>
                          <Badge variant={staff.role === 'farmer' ? 'primary' : 'info'} className="capitalize">
                            {staff.role === 'farmer' ? 'Farmer' : 'Sales Person'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                          <div>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Email</span>
                            <span className="text-slate-800 block truncate">{staff.email || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mobile</span>
                            <span className="text-slate-800">{staff.phone || 'N/A'}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Address</span>
                            <span className="text-slate-650">{staff.address || 'Not Provided'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Created At</span>
                            <span className="text-slate-500">
                              {new Date(staff.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => openEditModal(staff)}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-white border border-slate-200 hover:bg-emerald-50 rounded-lg transition shadow-sm"
                          >
                            ✏️ Edit
                          </button>
                          {session?.user && (session.user as any).id !== staff.id && (
                            <button
                              type="button"
                              onClick={() => handleDelete(staff.id, staff.name)}
                              className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-white border border-slate-200 hover:bg-rose-50 rounded-lg transition shadow-sm"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Staff Credentials Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-extrabold text-slate-900">Edit Staff Credentials</h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-bold mb-4 leading-relaxed">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Name <span className="text-rose-500 font-black ml-1">^</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ram Kumar"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address <span className="text-rose-500 font-black ml-1">^</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ram@sasyakhetr.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Mobile Number <span className="text-rose-500 font-black ml-1">^</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Role <span className="text-rose-500 font-black ml-1">^</span>
                </label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    className={`py-2 px-3 rounded-md text-xs font-bold transition capitalize ${
                      editRole === 'salesperson'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                    onClick={() => setEditRole('salesperson')}
                  >
                    💼 Sales Person
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-3 rounded-md text-xs font-bold transition capitalize ${
                      editRole === 'farmer'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                    onClick={() => setEditRole('farmer')}
                  >
                    👨‍🌾 Farmer/Owner
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Address details (Optional)"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Change Password (leave blank to keep current)</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 pl-4 pr-12 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 focus:outline-none"
                      >
                        {showEditPassword ? '👁️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showEditConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={editConfirmPassword}
                        onChange={(e) => setEditConfirmPassword(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 pl-4 pr-12 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 focus:outline-none"
                      >
                        {showEditConfirmPassword ? '👁️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStaff(null)}
                  className="py-2 text-xs font-bold animate-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={editSubmitting}
                  className="py-2 text-xs font-bold animate-button"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
