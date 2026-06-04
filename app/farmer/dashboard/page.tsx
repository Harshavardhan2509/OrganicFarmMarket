'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'

interface SummaryStats {
  totalRevenue: number
  totalSalesCount: number
  activeOrdersCount: number
  lowStockAlertCount: number
}

interface SalesHistoryItem {
  date: string
  revenue: number
}

interface ProductSalesItem {
  name: string
  quantity: number
  revenue: number
  stock: number
}

interface LowStockItem {
  id: string
  name: string
  quantity: number
  category: string
}

export default function FarmerDashboard() {
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [history, setHistory] = useState<SalesHistoryItem[]>([])
  const [productSales, setProductSales] = useState<ProductSalesItem[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/sales')
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
        setHistory(data.salesHistory)
        setProductSales(data.productSalesData)
        setLowStock(data.lowStockItems)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Business Overview</h1>
            <p className="text-sm text-slate-500 font-medium">Real-time agricultural business insights & sales analytics</p>
          </div>
          <Link href="/farmer/dashboard/inventory/new">
            <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-md shadow-emerald-600/10 hover:shadow active:scale-[0.98]">
              ➕ Add New Product
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Metric summaries card row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card hoverEffect={true} className="bg-white border border-slate-100 flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-sm border border-emerald-100">
                  💰
                </div>
                <div>
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Gross Revenue</span>
                  <span className="text-2xl font-black text-slate-900">₹{summary?.totalRevenue.toFixed(2) || '0.00'}</span>
                </div>
              </Card>

              <Card hoverEffect={true} className="bg-white border border-slate-100 flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shadow-sm border border-amber-100">
                  📈
                </div>
                <div>
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Total Sales</span>
                  <span className="text-2xl font-black text-slate-900">{summary?.totalSalesCount || 0}</span>
                </div>
              </Card>

              <Card hoverEffect={true} className="bg-white border border-slate-100 flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl shadow-sm border border-sky-100">
                  📬
                </div>
                <div>
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Active Orders</span>
                  <span className="text-2xl font-black text-slate-900">{summary?.activeOrdersCount || 0}</span>
                </div>
              </Card>

              <Card hoverEffect={true} className="bg-white border border-slate-100 flex items-center gap-4 p-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border ${
                  summary?.lowStockAlertCount && summary.lowStockAlertCount > 0
                    ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  ⚠️
                </div>
                <div>
                  <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-400 block leading-none">Low Stock Alerts</span>
                  <span className="text-2xl font-black text-slate-900">{summary?.lowStockAlertCount || 0}</span>
                </div>
              </Card>
            </div>

            {/* Recharts Analytics Graphic row */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Daily revenue area chart */}
              <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6 lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Weekly Revenue Trends</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">Last 7 Days</span>
                </div>

                <div className="w-full h-80 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '600' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '600' }} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#a7f3d0', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Product Performance Bar Chart */}
              <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6 lg:col-span-1 space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Top Selling Products</h3>
                
                {productSales.length === 0 ? (
                  <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-4xl block mb-2">📊</span>
                    <p className="text-xs font-semibold">No sales logged yet.</p>
                  </div>
                ) : (
                  <div className="w-full h-80 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productSales.slice(0, 5)} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '600' }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '600' }} />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>

            {/* Alerts Table lists */}
            {lowStock.length > 0 && (
              <Card hoverEffect={false} className="bg-white border border-rose-100 shadow-md shadow-rose-50/50 p-6 space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Low Stock Warnings</span>
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Product Name</th>
                        <th className="px-6 py-3 font-semibold">Category</th>
                        <th className="px-6 py-3 font-semibold">Stock Remaining</th>
                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                      {lowStock.map((prod) => (
                        <tr key={prod.id} className="hover:bg-rose-50/10 transition">
                          <td className="px-6 py-3 font-bold text-slate-900">{prod.name}</td>
                          <td className="px-6 py-3">{prod.category}</td>
                          <td className="px-6 py-3 text-rose-600 font-black">{prod.quantity} Units left</td>
                          <td className="px-6 py-3 text-right">
                            <Link href={`/farmer/dashboard/inventory/${prod.id}`}>
                              <button className="text-xxs uppercase tracking-wider font-extrabold text-emerald-600 hover:text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition">
                                Restock
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
