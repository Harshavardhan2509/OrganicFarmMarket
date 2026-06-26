'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Navbar from '@/components/common/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function BillingSettingsPage() {
  const [storeName, setStoreName] = useState('Sasya Khetr')
  const [contactInfo, setContactInfo] = useState('Direct Local Organic Farm Connection')
  const [headerText, setHeaderText] = useState('TAX INVOICE / MEMO')
  const [footerText, setFooterText] = useState('Thank you for supporting organic local farms! 🌱')
  const [receiptWidth, setReceiptWidth] = useState('80mm')
  
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('billing_template_settings')
        if (saved) {
          const settings = JSON.parse(saved)
          if (settings.storeName) setStoreName(settings.storeName)
          if (settings.contactInfo) setContactInfo(settings.contactInfo)
          if (settings.headerText) setHeaderText(settings.headerText)
          if (settings.footerText) setFooterText(settings.footerText)
          if (settings.receiptWidth) setReceiptWidth(settings.receiptWidth)
        }
      } catch (e) {
        console.error('Failed to load billing template settings', e)
      }
    }
  }, [])

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedMessage(null)
    
    const settings = {
      storeName: storeName.trim(),
      contactInfo: contactInfo.trim(),
      headerText: headerText.trim(),
      footerText: footerText.trim(),
      receiptWidth
    }

    try {
      localStorage.setItem('billing_template_settings', JSON.stringify(settings))
      setSavedMessage('Billing template settings saved successfully! ⚙️')
      setTimeout(() => setSavedMessage(null), 3000)
    } catch (err) {
      console.error(err)
      alert('Failed to save settings to browser.')
    }
  }

  const handleResetSettings = () => {
    if (!window.confirm('Reset billing template to factory defaults?')) return
    setStoreName('Sasya Khetr')
    setContactInfo('Direct Local Organic Farm Connection')
    setHeaderText('TAX INVOICE / MEMO')
    setFooterText('Thank you for supporting organic local farms! 🌱')
    setReceiptWidth('80mm')
    localStorage.removeItem('billing_template_settings')
    
    setSavedMessage('Billing template reset to default.')
    setTimeout(() => setSavedMessage(null), 3000)
  }

  // Preview dimensions
  const previewWidthClass = receiptWidth === '58mm' ? 'w-[260px]' : receiptWidth === '80mm' ? 'w-[320px]' : 'w-[480px]'

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Receipt Template Settings</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Customize the invoice layout, headers, footers, and sizes printed by smaller supermarket thermal printers.
          </p>
        </div>

        {savedMessage && (
          <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-xl flex items-center gap-3 border border-slate-800 animate-slide-in">
            <span>{savedMessage}</span>
            <button onClick={() => setSavedMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Settings form panel */}
          <div className="lg:col-span-6">
            <Card hoverEffect={false} className="bg-white border border-slate-100 shadow-md p-6">
              <h2 className="text-base font-extrabold text-slate-950 mb-6 border-b border-slate-50 pb-3">Edit Invoice Metadata</h2>
              
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Store / Farm Name
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-emerald-500 font-semibold"
                    placeholder="e.g. Sasya Khetr"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Contact Info / Address line
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-emerald-500 font-semibold"
                    placeholder="e.g. Farm Road, Bengaluru"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Invoice Header Subtitle
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-emerald-500 font-semibold"
                    placeholder="e.g. TAX INVOICE / MEMO"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Receipt Footer Note
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-emerald-500 font-medium"
                    placeholder="e.g. Thank you for shopping!"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Printer Page Width
                  </label>
                  <select
                    className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none bg-white focus:border-emerald-500 font-semibold"
                    value={receiptWidth}
                    onChange={(e) => setReceiptWidth(e.target.value)}
                  >
                    <option value="58mm">58mm (Ultra Compact Thermal Paper)</option>
                    <option value="80mm">80mm (Standard receipt / Supermarkets)</option>
                    <option value="A4">A4 / Full Width (Desktop printers)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Select A4 for standard full invoice, or 58mm/80mm for compact receipt rolls.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button type="submit" className="w-full sm:flex-1">
                    💾 Save Configurations
                  </Button>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition text-center"
                  >
                    Reset Defaults
                  </button>
                </div>
              </form>
            </Card>
          </div>

          {/* Live Receipt Preview Widget */}
          <div className="lg:col-span-6 flex flex-col items-center w-full max-w-full">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 block">
              Live Thermal Printer Preview
            </span>
            
            {/* Mock thermal paper background */}
            <div className="bg-slate-300/40 border border-slate-200/60 rounded-3xl p-4 sm:p-6 shadow-inner flex justify-center w-full min-h-[500px] max-w-full overflow-x-auto">
              <div
                className={`bg-white text-black shadow-lg p-5 font-mono text-[11px] h-fit transition-all duration-300 leading-normal border-t-[8px] border-emerald-650 shrink-0 ${previewWidthClass}`}
                style={{ fontFamily: 'monospace' }}
              >
                {/* Header preview */}
                <div className="text-center">
                  <div className="font-extrabold text-[13px] uppercase tracking-tight" style={{ fontWeight: 'bold' }}>
                    {storeName || 'Sasya Khetr'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {contactInfo || 'Direct Organic Farm Connection'}
                  </div>
                  <div className="border-t border-b border-dashed border-black py-1 my-2 font-bold uppercase tracking-wider text-[10px]">
                    {headerText || 'TAX INVOICE / MEMO'}
                  </div>
                </div>

                {/* Meta details preview */}
                <div className="my-3 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-bold">#ORD-984310</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date/Time:</span>
                    <span className="font-bold">{new Date().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold">Jane Doe</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-bold">9876543210</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className="font-bold">PRE-ORDER</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black my-2"></div>
                <div className="font-bold text-[9px] text-slate-600 flex justify-between mb-2">
                  <span>PARTICULARS</span>
                  <span>AMOUNT</span>
                </div>
                <div className="border-t border-dashed border-black my-2"></div>

                {/* Items list preview */}
                <div className="space-y-3">
                  <div>
                    <span className="font-bold block uppercase">1. Organic Tomatoes (1kg)</span>
                    <div className="flex justify-between text-slate-600 text-[10px] mt-0.5">
                      <span>2 Unit(s) x ₹40.00</span>
                      <span className="font-bold text-black">₹80.00</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold block uppercase">2. Fresh Apples (500g)</span>
                    <div className="flex justify-between text-slate-600 text-[10px] mt-0.5">
                      <span>1 Unit(s) x ₹120.00</span>
                      <span className="font-bold text-black">₹120.00</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-black my-3"></div>

                {/* Totals summary preview */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Produce Subtotal:</span>
                    <span>₹200.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500 italic">
                    <span>CGST (0% GST):</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500 italic">
                    <span>SGST (0% GST):</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>₹30.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs border-t border-dashed border-black pt-2 mt-1">
                    <span>GRAND TOTAL:</span>
                    <span className="text-emerald-800 font-extrabold text-[13px]">₹230.00</span>
                  </div>
                </div>

                <div className="border-t border-double border-black my-3"></div>

                {/* Footer preview */}
                <div className="text-center text-[9px] text-slate-500 leading-relaxed font-semibold">
                  {footerText || 'Thank you for supporting organic local farms!'}
                </div>
                <div className="text-center text-[10px] tracking-[4px] text-slate-300 mt-2 select-none">
                  ||||| | |||| ||| || |||||| | ||| |||||
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
