export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const DEFAULT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Meat',
  'Other'
]

export async function GET(request: NextRequest) {
  try {
    let categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })

    if (categories.length === 0) {
      // Seed default categories
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map(name => ({ name }))
      })
      categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      })
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const { name } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Check if category already exists (case-insensitive check is best, but let's query exactly)
    const existing = await prisma.category.findUnique({
      where: { name: trimmedName }
    })

    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { name: trimmedName }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Category POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const name = searchParams.get('name')

    if (!id && !name) {
      return NextResponse.json({ error: 'Category ID or name is required' }, { status: 400 })
    }

    // Find the category
    const category = await prisma.category.findFirst({
      where: id ? { id } : { name: name || undefined }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category.name.toLowerCase() === 'other') {
      return NextResponse.json({ error: 'Cannot delete the "Other" category' }, { status: 400 })
    }

    // Ensure "Other" exists as a fallback category. If not, create it.
    let otherCategory = await prisma.category.findUnique({
      where: { name: 'Other' }
    })

    if (!otherCategory) {
      otherCategory = await prisma.category.create({
        data: { name: 'Other' }
      })
    }

    // Reassign products of this category to "Other"
    await prisma.product.updateMany({
      where: { category: category.name },
      data: { category: 'Other' }
    })

    // Delete the category
    await prisma.category.delete({
      where: { id: category.id }
    })

    return NextResponse.json({ message: `Category "${category.name}" deleted and associated products moved to "Other"` })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
