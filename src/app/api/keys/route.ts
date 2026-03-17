import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

interface ExtendedUser {
  id: string
  email?: string | null
  name?: string | null
}

function generateApiKey(): string {
  return 'cdy_' + randomBytes(32).toString('hex')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as ExtendedUser)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      key: true,
      lastUsed: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Mask keys - only show last 8 chars
  const masked = keys.map(k => ({
    ...k,
    key: 'cdy_...' + k.key.slice(-8)
  }))

  return NextResponse.json(masked)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as ExtendedUser)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const name = body.name || 'Default'

  const key = generateApiKey()

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      key,
      userId
    },
    select: {
      id: true,
      name: true,
      key: true,
      createdAt: true
    }
  })

  // Return full key only on creation
  return NextResponse.json(apiKey, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as ExtendedUser)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'Missing key id' }, { status: 400 })
  }

  // Ensure the key belongs to this user
  const existing = await prisma.apiKey.findFirst({
    where: { id, userId }
  })

  if (!existing) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  await prisma.apiKey.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
