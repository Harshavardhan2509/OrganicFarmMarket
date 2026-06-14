'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Table from '@/components/ui/Table'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface StallArea {
  id: string
  name: string
  createdAt: string
}

export default function StallAreasPage() {
  const [stalls, setStalls] = useState<StallArea[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Edit states
  const [editingStall, setEditingStall] = useState<StallArea | null>(null)
  const [editName, setEditName] = useState('')
  const [editingLoading, setEditingLoading] = useState(false)

  const fetchStalls = async () => {
    try {
      const res = await fetch('/api/stalls')
      if (res.ok) {
        const data = await res.json()
        setStalls(data)
      }
    } catch (err) {
      console.error('Failed to load stalls:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStalls()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!name.trim()) {
      setError('Stall Area name is required.')
      return
    }
    setSubmitting(true)

    try {
      const res = await fetch('/api/stalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(`Successfully added Stall Area: ${name}`)
        setName('')
        fetchStalls()
      } else {
        throw new Error(data.error || 'Failed to create stall area')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStall || !editName.trim()) return
    setEditingLoading(true)

    try {
      const res = await fetch(`/api/stalls/${editingStall.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })

      const data = await res.json()
      if (res.ok) {
        setEditingStall(null)
        setEditName('')
        fetchStalls()
      } else {
        alert(data.error || 'Failed to update Stall Area')
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setEditingLoading(false)
    }
  }

  const handleDelete = async (id: string, stallName: string) => {
    if (!window.confirm(`Are you sure you want to delete the Stall Area "${stallName}"?`)) return
    try {
      const res = await fetch(`/api/stalls/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchStalls()
      } else {
        alert('Failed to delete Stall Area')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['farmer', 'salesperson']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Stall Areas</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Define and manage secure physical stall locations for sales points.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Add Stall Form */}
          <div className="lg:col-span-4">
            <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 border-b border-slate-50 pb-2">
                Add Stall Area
              </h2>

              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-bold mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800 font-bold mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Stall Area Name <span className="text-rose-500 font-black ml-1">^</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stall 12, Sunday Market"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                  />
                </div>

                <Button type="submit" loading={submitting} className="w-full py-2.5 text-sm font-bold">
                  Add Area
                </Button>
              </form>
            </Card>
          </div>

          {/* Stalls Directory */}
          <div className="lg:col-span-8">
            <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 border-b border-slate-50 pb-2">
                Active Stall Areas
              </h2>

              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : stalls.length === 0 ? (
                <p className="text-center py-8 text-sm font-semibold text-slate-450 italic">No stall locations defined yet.</p>
              ) : (
                <Table headers={['Stall Name', 'Created Date', 'Actions']}>
                  {stalls.map((stall) => (
                    <tr key={stall.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{stall.name}</td>
                      <td className="px-6 py-4 text-slate-450 font-semibold">
                        {new Date(stall.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStall(stall)
                              setEditName(stall.name)
                            }}
                            className="text-xs font-bold text-emerald-650 hover:text-emerald-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(stall.id, stall.name)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </div>
        </div>

        {/* Edit Stall Area Modal */}
        {editingStall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Edit Stall Area</h3>
                <button
                  onClick={() => setEditingStall(null)}
                  className="text-slate-400 hover:text-slate-650 font-bold transition"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Stall Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Stall Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 font-semibold"
                    />
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStall(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition"
                  >
                    Cancel
                  </button>
                  <Button type="submit" loading={editingLoading} className="py-2 px-4 text-sm font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
