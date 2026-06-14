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
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const { id } = params
    const { name, email, password, phone, address } = await request.json()

    // Find the customer first
    const customer = await prisma.user.findFirst({
      where: { id, role: 'customer' }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
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

    if (address !== undefined) {
      updateData.address = address ? address.trim() : null
    }

    const updatedCustomer = await prisma.user.update({
      where: { id },
      data: updateData
    })

    const { password: _, ...safeCustomer } = updatedCustomer
    return NextResponse.json(safeCustomer)
  } catch (error: any) {
    console.error('Update customer error:', error)
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
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const { id } = params

    const customer = await prisma.user.findFirst({
      where: { id, role: 'customer' }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error: any) {
    console.error('Delete customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
