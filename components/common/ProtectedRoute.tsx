'use client'

import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('customer' | 'farmer' | 'salesperson')[]
  allowGuest?: boolean
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  allowGuest
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      if (allowGuest) return
      router.push('/auth/login')
      return
    }

    if (session?.user && allowedRoles) {
      const userRole = (session.user as any).role as 'customer' | 'farmer' | 'salesperson'
      if (!allowedRoles.includes(userRole)) {
        // Redirect to their default dashboard if they have the wrong role
        if (userRole === 'farmer') {
          router.push('/farmer/dashboard')
        } else if (userRole === 'salesperson') {
          router.push('/farmer/dashboard/counter')
        } else {
          router.push('/customer/dashboard')
        }
      }
    }
  }, [status, session, allowedRoles, router, allowGuest])

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Verifying secure session...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return allowGuest ? <>{children}</> : null // Will redirect in useEffect
  }

  if (session?.user && allowedRoles) {
    const userRole = (session.user as any).role as 'customer' | 'farmer' | 'salesperson'
    if (!allowedRoles.includes(userRole)) {
      return null // Will redirect in useEffect
    }
  }

  return <>{children}</>
}
