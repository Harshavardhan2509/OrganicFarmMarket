'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

interface BillingRecord {
  id: string
  orderId: string
  transactionId: string
  amount: number
  paymentMethod: string
  status: string
  createdAt: string
}

export default function CustomerBillingPage() {
  const [billingLogs, setBillingLogs] = useState<BillingRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBillingLogs = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const orders = await res.json()
        
        // Flatten billing logs from orders
        const logs: BillingRecord[] = []
        orders.forEach((order: any) => {
          if (order.billingLogs && order.billingLogs.length > 0) {
            order.billingLogs.forEach((log: any) => {
              logs.push({
                id: log.id,
                orderId: log.orderId,
                transactionId: log.transactionId || 'N/A',
                amount: log.amount,
                paymentMethod: log.paymentMethod || 'Credit Card',
                status: log.status,
                createdAt: log.createdAt
              })
            })
          }
        })

        // Sort by date descending
        logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setBillingLogs(logs)
      }
    } catch (err) {
      console.error('Failed to load billing details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingLogs()
  }, [])

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Billing Logs & Receipts</h1>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : billingLogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-5xl block mb-4">💰</span>
            <h3 className="text-lg font-bold text-slate-900">No Billing Records</h3>
            <p className="text-sm text-slate-500 mt-1 px-4">
              Your billing logs will appear here once you place your first order.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
              <h3 className="text-base font-extrabold text-slate-950 mb-4">Transaction Ledger</h3>
              
              <Table headers={['Transaction Ref', 'Order ID', 'Method', 'Date', 'Value Charged', 'Status']}>
                {billingLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-black uppercase text-xs text-slate-800">
                      {log.transactionId}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono uppercase text-slate-500">
                      {log.orderId}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      💳 {log.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-950">
                      ₹{log.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={log.status === 'completed' ? 'success' : 'danger'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
