'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Table from '@/components/ui/Table'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  createdAt: string
}

export default function FarmerCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
            <p className="text-sm text-slate-500 mt-1">
              View and contact customers registered in the Organic Farm Marketplace.
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
            <div className="hidden md:block">
              <Table headers={['Name', 'Email Address', 'Phone Number', 'Delivery Address', 'Joined Date']}>
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
                    <td className="px-6 py-4 text-slate-450 font-semibold">
                      {new Date(customer.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
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
                      <span className="text-slate-450 block text-xxs font-extrabold uppercase">Address</span>
                      <span>{customer.address || <span className="text-slate-400 italic">Not Provided</span>}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
