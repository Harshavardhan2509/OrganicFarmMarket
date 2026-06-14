'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Table from '@/components/ui/Table'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  createdAt: string
  purchaseChannel?: string
}

export default function FarmerCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Edit Modal fields
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editConfirmPassword, setEditConfirmPassword] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
        setFilteredCustomers(data)
      } else {
        console.error('Failed to fetch customers')
      }
    } catch (err) {
      console.error('Failed to load farmer customers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.phone && c.phone.toLowerCase().includes(query)) ||
          (c.address && c.address.toLowerCase().includes(query))
      )
      setFilteredCustomers(filtered)
    }
  }, [searchQuery, customers])

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setEditName(customer.name)
    setEditEmail(customer.email || '')
    setEditPhone(customer.phone || '')
    setEditAddress(customer.address || '')
    setEditPassword('')
    setEditConfirmPassword('')
    setShowEditPassword(false)
    setShowEditConfirmPassword(false)
    setEditError(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) {
      setEditError('Name, Email, and Mobile Number are mandatory fields.')
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
      const res = await fetch(`/api/customers/${editingCustomer?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.toLowerCase().trim(),
          phone: editPhone.trim(),
          address: editAddress.trim() || null,
          password: editPassword || undefined
        })
      })

      const data = await res.json()
      if (res.ok) {
        setEditingCustomer(null)
        fetchCustomers()
      } else {
        throw new Error(data.error || 'Failed to update customer')
      }
    } catch (err: any) {
      setEditError(err.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer ${name}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        fetchCustomers()
      } else {
        alert(data.error || 'Failed to delete customer')
      }
    } catch (err: any) {
      console.error('Delete error:', err)
      alert('Failed to delete customer due to an error.')
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
            <p className="text-sm text-slate-500 mt-1">
              View and manage customers registered in Sasya Khetr.
            </p>
          </div>

          <div className="w-full md:w-80">
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-5xl block mb-4">👥</span>
            <h3 className="text-lg font-bold text-slate-900">No Customers Found</h3>
            <p className="text-sm text-slate-500 mt-1 px-4">
              {searchQuery ? 'Try adjusting your search filters.' : 'No customers have registered yet on the platform.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
              <Table headers={['Name', 'Email Address', 'Phone Number', 'Delivery Address', 'Channel', 'Joined Date', 'Actions']}>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{customer.name}</td>
                    <td className="px-6 py-4 text-slate-650">{customer.email}</td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="hover:text-emerald-700 transition">
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not Provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-650 max-w-xs truncate" title={customer.address || ''}>
                      {customer.address || <span className="text-slate-400 italic">Not Provided</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">
                      <span className={`px-2.5 py-1 rounded-full text-xxs font-black capitalize border ${
                        customer.purchaseChannel === 'live-counter' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        customer.purchaseChannel === 'pre-order' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        customer.purchaseChannel === 'both' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {customer.purchaseChannel || 'pre-order'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-450 font-semibold">
                      {new Date(customer.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(customer)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded transition"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>

            {/* Mobile Grid/Card View */}
            <div className="grid gap-4 md:hidden">
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} hoverEffect={false} className="bg-white border border-slate-100 shadow-sm p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-base">{customer.name}</h3>
                    <span className="text-xxs text-slate-400 font-bold uppercase">
                      Joined: {new Date(customer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-slate-650 font-semibold">
                    <div>
                      <span className="text-slate-450 block text-xxs font-extrabold uppercase">Email</span>
                      <span className="text-slate-900">{customer.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 block text-xxs font-extrabold uppercase">Phone</span>
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="text-emerald-700">
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not Provided</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xxs font-extrabold uppercase">Address</span>
                      <span>{customer.address || <span className="text-slate-400 italic">Not Provided</span>}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xxs font-extrabold uppercase">Purchase Channel</span>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xxs font-black capitalize border mt-1 ${
                        customer.purchaseChannel === 'live-counter' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        customer.purchaseChannel === 'pre-order' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        customer.purchaseChannel === 'both' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {customer.purchaseChannel || 'pre-order'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(customer)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(customer.id, customer.name)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-extrabold text-slate-900">Edit Customer Profile</h3>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
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
                  placeholder="Customer Full Name"
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
                  placeholder="Customer Email Address"
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
                <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Delivery Address"
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
                  onClick={() => setEditingCustomer(null)}
                  className="py-2 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={editSubmitting}
                  className="py-2 text-xs font-bold"
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
