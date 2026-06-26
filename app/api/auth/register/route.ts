import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, phone, address } = await request.json()

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
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingEmail && existingEmail.password) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Mobile number is mandatory' }, { status: 400 })
    }
    if (!address || !address.trim()) {
      return NextResponse.json({ error: 'Address is mandatory' }, { status: 400 })
    }
    const normalizedPhone = phone.trim()
    const existingPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    })
    if (existingPhone && existingPhone.password) {
      return NextResponse.json(
        { error: 'A user with this mobile number already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userRole = role === 'farmer' ? 'farmer' : 'customer'

    // Create or update user, and cart in a transaction if role is customer
    const user = await prisma.$transaction(async (tx) => {
      let resultUser

      if (existingPhone && !existingPhone.password) {
        resultUser = await tx.user.update({
          where: { id: existingPhone.id },
          data: {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: userRole,
            address: address.trim()
          }
        })
      } else if (existingEmail && !existingEmail.password) {
        resultUser = await tx.user.update({
          where: { id: existingEmail.id },
          data: {
            name: name.trim(),
            phone: normalizedPhone,
            password: hashedPassword,
            role: userRole,
            address: address.trim()
          }
        })
      } else {
        resultUser = await tx.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: userRole,
            phone: normalizedPhone,
            address: address.trim()
          }
        })
      }

      if (userRole === 'customer') {
        const existingCart = await tx.cart.findUnique({
          where: { userId: resultUser.id }
        })
        if (!existingCart) {
          await tx.cart.create({
            data: {
              userId: resultUser.id
            }
          })
        }
      }

      return resultUser
    })

    // Remove password before returning
    const { password: _, ...safeUser } = user

    return NextResponse.json(
      { message: 'User registered successfully', user: safeUser },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
