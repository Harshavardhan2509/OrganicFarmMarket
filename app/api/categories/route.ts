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
    if (!session || !(session.user as any).id || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const { name, cgst, sgst } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { name: trimmedName }
    })

    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
    }

    const parsedCgst = cgst !== undefined ? parseFloat(cgst) : 0
    const parsedSgst = sgst !== undefined ? parseFloat(sgst) : 0

    if (isNaN(parsedCgst) || parsedCgst < 0 || isNaN(parsedSgst) || parsedSgst < 0) {
      return NextResponse.json({ error: 'CGST and SGST must be valid non-negative numbers' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        cgst: parsedCgst,
        sgst: parsedSgst
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Category POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized. Farmers only.' }, { status: 401 })
    }

    const { id, name, cgst, sgst } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const oldName = category.name
    let trimmedName = oldName
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Category name cannot be empty' }, { status: 400 })
      }
      trimmedName = name.trim()
    }

    // Check if new name taken by another category
    if (trimmedName !== oldName) {
      const duplicate = await prisma.category.findUnique({
        where: { name: trimmedName }
      })
      if (duplicate) {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 })
      }
      
      if (oldName.toLowerCase() === 'other') {
        return NextResponse.json({ error: 'Cannot rename the default "Other" category' }, { status: 400 })
      }
    }

    const parsedCgst = cgst !== undefined ? parseFloat(cgst) : category.cgst
    const parsedSgst = sgst !== undefined ? parseFloat(sgst) : category.sgst

    if (isNaN(parsedCgst) || parsedCgst < 0 || isNaN(parsedSgst) || parsedSgst < 0) {
      return NextResponse.json({ error: 'CGST and SGST must be valid non-negative numbers' }, { status: 400 })
    }

    // Update Category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        cgst: parsedCgst,
        sgst: parsedSgst
      }
    })

    // If name changed, update existing products using the old name
    if (trimmedName !== oldName) {
      await prisma.product.updateMany({
        where: { category: oldName },
        data: { category: trimmedName }
      })
    }

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Category PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id || (session.user as any).role !== 'farmer') {
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
