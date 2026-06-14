import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendOtpSms } from '@/lib/sms'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is mandatory' }, { status: 400 })
    }

    const normalizedPhone = phone.trim()
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    })

    if (!user) {
      return NextResponse.json({ error: 'Mobile number not registered. Please sign up first.' }, { status: 404 })
    }

    // Generate a 6-digit OTP code (mock)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpires: expires
      }
    })

    // Send OTP to user's mobile number
    await sendOtpSms(normalizedPhone, otp)

    return NextResponse.json({
      message: 'OTP sent successfully'
    })
  } catch (error: any) {
    console.error('Send OTP login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
