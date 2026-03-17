import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

async function verifyColumnOwnership(columnId: string, userId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: { select: { userId: true } } }
  })
  if (!column || column.board.userId !== userId) return null
  return column
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ columnId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { columnId } = await params
  const column = await verifyColumnOwnership(columnId, userId)
  if (!column) return NextResponse.json({ error: 'Column not found' }, { status: 404 })

  const full = await prisma.column.findUnique({
    where: { id: columnId },
    include: {
      cards: {
        include: { tasks: { orderBy: { position: 'asc' } } },
        orderBy: { position: 'asc' }
      }
    }
  })

  return NextResponse.json(full)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ columnId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { columnId } = await params
  const column = await verifyColumnOwnership(columnId, userId)
  if (!column) return NextResponse.json({ error: 'Column not found' }, { status: 404 })

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.position !== undefined) data.position = body.position

  const updated = await prisma.column.update({
    where: { id: columnId },
    data
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ columnId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { columnId } = await params
  const column = await verifyColumnOwnership(columnId, userId)
  if (!column) return NextResponse.json({ error: 'Column not found' }, { status: 404 })

  await prisma.column.delete({ where: { id: columnId } })

  return NextResponse.json({ ok: true })
}
