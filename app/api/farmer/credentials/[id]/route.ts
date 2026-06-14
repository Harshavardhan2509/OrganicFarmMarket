import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { name, email, password, phone, role, address } = await request.json()

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Name is mandatory' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (email !== undefined) {
      if (!email || !email.trim()) {
        return NextResponse.json({ error: 'Email is mandatory' }, { status: 400 })
      }
      const normalizedEmail = email.toLowerCase().trim()
      // Verify email doesn't exist for another user
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id }
        }
      })
      if (existingEmail) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
      }
      updateData.email = normalizedEmail
    }

    if (phone !== undefined) {
      if (!phone || !phone.trim()) {
        return NextResponse.json({ error: 'Mobile number is mandatory' }, { status: 400 })
      }
      const normalizedPhone = phone.trim()
      // Verify phone doesn't exist for another user
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: normalizedPhone,
          NOT: { id }
        }
      })
      if (existingPhone) {
        return NextResponse.json({ error: 'A user with this mobile number already exists' }, { status: 400 })
      }
      updateData.phone = normalizedPhone
    }

    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (role !== undefined) {
      if (!role || !['farmer', 'salesperson'].includes(role)) {
        return NextResponse.json({ error: 'Valid role is mandatory' }, { status: 400 })
      }
      updateData.role = role
    }

    if (address !== undefined) {
      updateData.address = address ? address.trim() : null
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })

    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json(safeUser)
  } catch (error: any) {
    console.error('Update credentials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Prevent deleting self
    if ((session.user as any).id === id) {
      return NextResponse.json({ error: 'You cannot delete your own credentials' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Staff credentials deleted successfully' })
  } catch (error: any) {
    console.error('Delete credentials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
