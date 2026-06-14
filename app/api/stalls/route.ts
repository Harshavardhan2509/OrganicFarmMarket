import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const stalls = await prisma.stallArea.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(stalls)
  } catch (error: any) {
    console.error('Fetch stalls error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Stall Area name is mandatory' }, { status: 400 })
    }

    const normalizedName = name.trim()

    // Check if duplicate
    const existing = await prisma.stallArea.findUnique({
      where: { name: normalizedName }
    })

    if (existing) {
      return NextResponse.json({ error: 'A Stall Area with this name already exists' }, { status: 400 })
    }

    const newStall = await prisma.stallArea.create({
      data: { name: normalizedName }
    })

    return NextResponse.json(newStall, { status: 201 })
  } catch (error: any) {
    console.error('Create stall error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
