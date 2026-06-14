import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Ensure upload directory exists inside public folder
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })

    // Create a unique filename to prevent collisions
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const originalExtension = path.extname(file.name) || '.jpg'
    const fileName = `product-${uniqueSuffix}${originalExtension}`
    const filePath = path.join(uploadDir, fileName)

    // Write the buffer to the filesystem
    await fs.writeFile(filePath, buffer)

    // Return the relative URL to access the uploaded file
    const urlPath = `/uploads/${fileName}`
    return NextResponse.json({ url: urlPath }, { status: 201 })
  } catch (error: any) {
    console.error('Local file upload error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
