import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

async function verifyCardOwnership(cardId: string, userId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { column: { include: { board: { select: { userId: true } } } } }
  })
  if (!card || card.column.board.userId !== userId) return null
  return card
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cardId } = await params
  const card = await verifyCardOwnership(cardId, userId)
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const full = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      tasks: { orderBy: { position: 'asc' } },
      column: { select: { id: true, name: true } }
    }
  })

  return NextResponse.json(full)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cardId } = await params
  const card = await verifyCardOwnership(cardId, userId)
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.color !== undefined) data.color = body.color
  if (body.position !== undefined) data.position = body.position
  if (body.columnId !== undefined) {
    // Verify target column belongs to user
    const targetCol = await prisma.column.findUnique({
      where: { id: body.columnId },
      include: { board: { select: { userId: true } } }
    })
    if (!targetCol || targetCol.board.userId !== userId) {
      return NextResponse.json({ error: 'Target column not found' }, { status: 404 })
    }
    data.columnId = body.columnId
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data,
    include: { tasks: { orderBy: { position: 'asc' } } }
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cardId } = await params
  const card = await verifyCardOwnership(cardId, userId)
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  await prisma.card.delete({ where: { id: cardId } })

  return NextResponse.json({ ok: true })
}
