'use client'

import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hoverEffect?: boolean
  glassmorphism?: boolean
}

export default function Card({
  children,
  hoverEffect = true,
  glassmorphism = false,
  className = '',
  ...props
}: CardProps) {
  const baseStyle = 'rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm shadow-slate-100/50 transition-all duration-300 max-w-full overflow-hidden'
  const hoverStyle = hoverEffect ? 'hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50' : ''
  const glassStyle = glassmorphism ? 'bg-white/80 backdrop-blur-md border border-white/40' : ''

  return (
    <div
      className={`${baseStyle} ${hoverStyle} ${glassStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
