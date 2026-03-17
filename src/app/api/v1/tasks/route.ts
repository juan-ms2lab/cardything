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

  const tasks = await prisma.task.findMany({
    where: { card: { column: { boardId: board.id } } },
    include: {
      card: {
        select: {
          id: true,
          name: true,
          column: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { position: 'asc' }
  })

  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.cardId || !body.name) {
    return NextResponse.json({ error: 'cardId and name are required' }, { status: 400 })
  }

  // Verify card belongs to user
  const card = await prisma.card.findUnique({
    where: { id: body.cardId },
    include: {
      column: { include: { board: { select: { userId: true } } } },
      tasks: { select: { position: true }, orderBy: { position: 'desc' }, take: 1 }
    }
  })

  if (!card || card.column.board.userId !== userId) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  const maxPos = card.tasks[0]?.position ?? -1

  const task = await prisma.task.create({
    data: {
      name: body.name,
      completed: body.completed ?? false,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      position: body.position ?? maxPos + 1,
      cardId: body.cardId
    }
  })

  return NextResponse.json(task, { status: 201 })
}
