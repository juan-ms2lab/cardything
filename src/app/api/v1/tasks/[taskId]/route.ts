import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

async function verifyTaskOwnership(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { card: { include: { column: { include: { board: { select: { userId: true } } } } } } }
  })
  if (!task || task.card.column.board.userId !== userId) return null
  return task
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = await params
  const task = await verifyTaskOwnership(taskId, userId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const full = await prisma.task.findUnique({
    where: { id: taskId },
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

  return NextResponse.json(full)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = await params
  const task = await verifyTaskOwnership(taskId, userId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.completed !== undefined) data.completed = body.completed
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (body.position !== undefined) data.position = body.position

  const updated = await prisma.task.update({
    where: { id: taskId },
    data
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await authenticateApiKey(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = await params
  const task = await verifyTaskOwnership(taskId, userId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  await prisma.task.delete({ where: { id: taskId } })

  return NextResponse.json({ ok: true })
}
