import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await prisma.user.findMany({
      where: {
        role: { in: ['farmer', 'salesperson'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(staff)
  } catch (error: any) {
    console.error('Fetch credentials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, password, phone, role, address } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is mandatory' }, { status: 400 })
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is mandatory' }, { status: 400 })
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: 'Password is mandatory' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is mandatory' }, { status: 400 })
    }
    if (!role || !['farmer', 'salesperson'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is mandatory' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPhone = phone.trim()

    // Verify email doesn't exist
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })
    if (existingEmail) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    // Verify phone doesn't exist
    const existingPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    })
    if (existingPhone) {
      return NextResponse.json({ error: 'A user with this mobile number already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizedPhone,
        role,
        address: address ? address.trim() : null
      }
    })

    // Remove password from response
    const { password: _, ...safeUser } = newUser

    return NextResponse.json(safeUser, { status: 201 })
  } catch (error: any) {
    console.error('Create credentials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
