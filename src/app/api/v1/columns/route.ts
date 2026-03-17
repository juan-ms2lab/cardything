import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = await authenticateApiKey(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const board = await prisma.board.findFirst({
    where: { userId },
    select: { id: true }
  })

  if (!board) {
    return NextResponse.json({ error: 'No board found' }, { status: 404 })
  }

  const columns = await prisma.column.findMany({
    where: { boardId: board.id },
    include: {
      cards: {
        include: {
          tasks: { orderBy: { position: 'asc' } }
        },
        orderBy: { position: 'asc' }
      }
    },
    orderBy: { position: 'asc' }
  })

  return NextResponse.json(columns)
}

export async function POST(request: NextRequest) {
  const userId = await authenticateApiKey(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const board = await prisma.board.findFirst({
    where: { userId },
    select: { id: true, columns: { select: { position: true }, orderBy: { position: 'desc' }, take: 1 } }
  })

  if (!board) {
    return NextResponse.json({ error: 'No board found' }, { status: 404 })
  }

  const body = await request.json()
  if (!body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const maxPos = board.columns[0]?.position ?? -1

  const column = await prisma.column.create({
    data: {
      name: body.name,
      position: maxPos + 1,
      boardId: board.id
    }
  })

  return NextResponse.json(column, { status: 201 })
}
