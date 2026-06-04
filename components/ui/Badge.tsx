'use client'

import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
  className?: string
}

export default function Badge({
  children,
  variant = 'secondary',
  className = ''
}: BadgeProps) {
  const baseStyle = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold leading-5 tracking-wide uppercase transition'
  
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    danger: 'bg-rose-50 text-rose-700 border border-rose-100',
    info: 'bg-sky-50 text-sky-700 border border-sky-100',
    primary: 'bg-emerald-600 text-white shadow-sm border border-emerald-600',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200'
  }

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
