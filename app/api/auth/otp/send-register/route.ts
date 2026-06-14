import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { registerOtps } from '@/lib/otpStore'
import { sendOtpSms } from '@/lib/sms'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, address } = await request.json()
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is mandatory' }, { status: 400 })
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is mandatory' }, { status: 400 })
    }

    const normalizedPhone = phone.trim()
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    })

    if (user) {
      return NextResponse.json({ error: 'Mobile number already registered. Please sign in.' }, { status: 400 })
    }

    // Generate a 6-digit OTP code (mock)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

    // Save in global memory store
    registerOtps.set(normalizedPhone, {
      name: name.trim(),
      otp,
      expires,
      address: address ? address.trim() : undefined
    })

    // Send OTP to user's mobile number
    await sendOtpSms(normalizedPhone, otp)

    return NextResponse.json({
      message: 'OTP sent successfully'
    })
  } catch (error: any) {
    console.error('Send OTP register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
