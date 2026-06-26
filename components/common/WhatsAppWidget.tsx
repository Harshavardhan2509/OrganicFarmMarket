'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function WhatsAppWidget() {
  const { data: session, status } = useSession()
  const userRole = (session?.user as any)?.role
  const pathname = usePathname()

  // Wait until loading completes to prevent layout flash
  if (status === 'loading') return null

  // Remove when on signin or signup pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  // Display floating WhatsApp support widget only for guest profiles or customer roles
  if (status === 'unauthenticated' || userRole === 'customer') {
    return (
      <a
        href="https://wa.me/918217331434?text=Hello%20Sasya%20Khetr!%20I%20have%20a%2520query%20about%20the%20organic%20produce."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full w-14 h-14 shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 duration-200 border border-emerald-400/20 cursor-pointer"
        title="Chat with us on WhatsApp"
      >
        <svg className="w-7 h-7 fill-current text-white shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-4.22c1.657.982 3.197 1.5 4.908 1.5 5.482 0 9.944-4.461 9.947-9.95.002-2.659-1.03-5.159-2.906-7.038C16.967 2.413 14.471 1.38 11.82 1.38 6.335 1.38 1.871 5.842 1.868 11.33c-.001 1.777.464 3.515 1.349 5.043l-.97 3.546 3.65-.959zm10.23-5.263c-.279-.139-1.647-.812-1.924-.913-.277-.1-.48-.152-.68.15-.201.302-.777.978-.953 1.179-.176.2-.353.226-.632.086-1.123-.564-1.96-1.025-2.733-2.35-.194-.334.194-.31.554-1.03.06-.12.03-.226-.015-.312-.045-.085-.48-1.155-.658-1.58-.172-.416-.36-.36-.48-.366-.124-.006-.267-.007-.41-.007-.143 0-.376.053-.573.267-.197.213-.75.733-.75 1.787 0 1.054.767 2.072.873 2.213.106.14 1.507 2.302 3.652 3.228.51.22 1.084.35 1.488.477.513.163.98.14 1.35.084.412-.063 1.647-.673 1.88-1.321.233-.648.233-1.204.163-1.321-.07-.117-.267-.197-.546-.336z"/>
        </svg>
      </a>
    )
  }

  return null
}
