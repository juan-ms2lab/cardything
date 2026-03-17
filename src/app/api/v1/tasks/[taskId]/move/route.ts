import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = await params

  // Verify task belongs to user
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { card: { include: { column: { include: { board: { select: { userId: true } } } } } } }
  })
  if (!task || task.card.column.board.userId !== userId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const body = await request.json()
  if (!body.targetCardId) {
    return NextResponse.json({ error: 'targetCardId is required' }, { status: 400 })
  }

  // Verify target card belongs to user
  const targetCard = await prisma.card.findUnique({
    where: { id: body.targetCardId },
    include: {
      column: { include: { board: { select: { userId: true } } } },
      tasks: { select: { position: true }, orderBy: { position: 'desc' }, take: 1 }
    }
  })
  if (!targetCard || targetCard.column.board.userId !== userId) {
    return NextResponse.json({ error: 'Target card not found' }, { status: 404 })
  }

  const maxPos = targetCard.tasks[0]?.position ?? -1
  const newPosition = body.position ?? maxPos + 1

  // If moving within the same card, reorder
  if (body.targetCardId === task.cardId) {
    // Shift tasks between old and new position
    if (newPosition < task.position) {
      await prisma.task.updateMany({
        where: {
          cardId: task.cardId,
          position: { gte: newPosition, lt: task.position }
        },
        data: { position: { increment: 1 } }
      })
    } else if (newPosition > task.position) {
      await prisma.task.updateMany({
        where: {
          cardId: task.cardId,
          position: { gt: task.position, lte: newPosition }
        },
        data: { position: { decrement: 1 } }
      })
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { position: newPosition }
    })

    return NextResponse.json(updated)
  }

  // Moving to different card
  // Shift tasks in source card (close the gap)
  await prisma.task.updateMany({
    where: {
      cardId: task.cardId,
      position: { gt: task.position }
    },
    data: { position: { decrement: 1 } }
  })

  // Shift tasks in target card (make room)
  await prisma.task.updateMany({
    where: {
      cardId: body.targetCardId,
      position: { gte: newPosition }
    },
    data: { position: { increment: 1 } }
  })

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      cardId: body.targetCardId,
      position: newPosition
    },
    include: {
      card: {
        select: {
          id: true,
          name: true,
          column: { select: { id: true, name: true } }
        }
      }
    }
  })

  return NextResponse.json(updated)
}
