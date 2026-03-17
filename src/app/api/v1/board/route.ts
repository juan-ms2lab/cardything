import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = await authenticateApiKey(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized. Provide API key via Authorization: Bearer <key> or X-API-Key header.' }, { status: 401 })
  }

  const board = await prisma.board.findFirst({
    where: { userId },
    include: {
      columns: {
        include: {
          cards: {
            include: {
              tasks: { orderBy: { position: 'asc' } }
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { position: 'asc' }
      }
    }
  })

  if (!board) {
    return NextResponse.json({ error: 'No board found' }, { status: 404 })
  }

  return NextResponse.json(board)
}
