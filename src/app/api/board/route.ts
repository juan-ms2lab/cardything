import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ExtendedUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as ExtendedUser)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const board = await prisma.board.findFirst({
      where: { userId },
      include: {
        columns: {
          include: {
            cards: {
              include: {
                tasks: {
                  orderBy: { position: 'asc' }
                }
              },
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    })

    if (!board) {
      // Create default board if none exists
      const newBoard = await prisma.board.create({
        data: {
          name: 'My Board',
          userId,
          columns: {
            create: [
              { name: 'To Do', position: 0 },
              { name: 'In Progress', position: 1 },
              { name: 'Done', position: 2 }
            ]
          }
        },
        include: {
          columns: {
            include: {
              cards: {
                include: {
                  tasks: {
                    orderBy: { position: 'asc' }
                  }
                },
                orderBy: { position: 'asc' }
              }
            },
            orderBy: { position: 'asc' }
          }
        }
      })
      return NextResponse.json(newBoard)
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error('Error fetching board:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as ExtendedUser)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const board = await request.json()

    // Update the board in the database
    // First, get the existing board
    const existingBoard = await prisma.board.findFirst({
      where: { userId },
      include: {
        columns: {
          include: {
            cards: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    })

    if (!existingBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Delete all existing data and recreate
    await prisma.task.deleteMany({
      where: {
        card: {
          column: {
            boardId: existingBoard.id
          }
        }
      }
    })

    await prisma.card.deleteMany({
      where: {
        column: {
          boardId: existingBoard.id
        }
      }
    })

    await prisma.column.deleteMany({
      where: { boardId: existingBoard.id }
    })

    // Create new columns, cards, and tasks
    for (const column of board.columns) {
      const createdColumn = await prisma.column.create({
        data: {
          name: column.name,
          position: column.position,
          boardId: existingBoard.id
        }
      })

      for (const card of column.cards) {
        const createdCard = await prisma.card.create({
          data: {
            name: card.name,
            color: card.color,
            position: card.position,
            columnId: createdColumn.id
          }
        })

        for (const task of card.tasks) {
          await prisma.task.create({
            data: {
              name: task.name,
              completed: task.completed,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              position: task.position,
              cardId: createdCard.id
            }
          })
        }
      }
    }

    // Fetch the updated board
    const updatedBoard = await prisma.board.findFirst({
      where: { userId },
      include: {
        columns: {
          include: {
            cards: {
              include: {
                tasks: {
                  orderBy: { position: 'asc' }
                }
              },
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedBoard)
  } catch (error) {
    console.error('Error updating board:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}