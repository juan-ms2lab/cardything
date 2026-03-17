import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const board = await prisma.board.findFirst({
    where: { userId },
    select: { id: true }
  })

  if (!board) return NextResponse.json({ error: 'No board found' }, { status: 404 })

  const cards = await prisma.card.findMany({
    where: { column: { boardId: board.id } },
    include: {
      tasks: { orderBy: { position: 'asc' } },
      column: { select: { id: true, name: true } }
    },
    orderBy: { position: 'asc' }
  })

  return NextResponse.json(cards)
}

export async function POST(request: NextRequest) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.columnId || !body.name) {
    return NextResponse.json({ error: 'columnId and name are required' }, { status: 400 })
  }

  // Verify column belongs to user
  const column = await prisma.column.findUnique({
    where: { id: body.columnId },
    include: {
      board: { select: { userId: true } },
      cards: { select: { position: true }, orderBy: { position: 'desc' }, take: 1 }
    }
  })

  if (!column || column.board.userId !== userId) {
    return NextResponse.json({ error: 'Column not found' }, { status: 404 })
  }

  const maxPos = column.cards[0]?.position ?? -1

  const card = await prisma.card.create({
    data: {
      name: body.name,
      color: body.color || '#3b82f6',
      position: maxPos + 1,
      columnId: body.columnId
    },
    include: { tasks: true }
  })

  return NextResponse.json(card, { status: 201 })
}
