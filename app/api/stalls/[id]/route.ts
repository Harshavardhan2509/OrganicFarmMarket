import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['farmer', 'salesperson'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Stall Area name is mandatory' }, { status: 400 })
    }

    const normalizedName = name.trim()

    // Check if name taken by another stall area
    const duplicate = await prisma.stallArea.findFirst({
      where: {
        name: normalizedName,
        NOT: { id }
      }
    })

    if (duplicate) {
      return NextResponse.json({ error: 'A Stall Area with this name already exists' }, { status: 400 })
    }

    const updatedStall = await prisma.stallArea.update({
      where: { id },
      data: { name: normalizedName }
    })

    return NextResponse.json(updatedStall)
  } catch (error: any) {
    console.error('Update stall error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['farmer', 'salesperson'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await prisma.stallArea.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Stall Area deleted successfully' })
  } catch (error: any) {
    console.error('Delete stall error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
