import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp, newPassword } = await request.json()

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is mandatory' }, { status: 400 })
    }
    if (!otp || !otp.trim()) {
      return NextResponse.json({ error: 'OTP is mandatory' }, { status: 400 })
    }
    if (!newPassword || !newPassword.trim()) {
      return NextResponse.json({ error: 'New password is mandatory' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedPhone = phone.trim()
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    })

    if (!user) {
      return NextResponse.json({ error: 'Mobile number not registered. Please sign up first.' }, { status: 404 })
    }

    if (!user.otp || user.otp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 })
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return NextResponse.json({ error: 'OTP code has expired. Please request a new one.' }, { status: 400 })
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null
      }
    })

    return NextResponse.json({ message: 'Password reset successfully!' })
  } catch (error: any) {
    console.error('Reset password API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
