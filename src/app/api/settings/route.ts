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

    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    })

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.userSettings.create({
        data: {
          userId
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
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

    const settingsData = await request.json()

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        backgroundColor: settingsData.backgroundColor,
        todayColor: settingsData.todayColor,
        thisWeekColor: settingsData.thisWeekColor,
        overdueColor: settingsData.overdueColor,
        todayThreshold: settingsData.todayThreshold,
        thisWeekThreshold: settingsData.thisWeekThreshold,
        twoWeekThreshold: settingsData.twoWeekThreshold,
        spacingLevel: settingsData.spacingLevel
      },
      create: {
        userId,
        backgroundColor: settingsData.backgroundColor,
        todayColor: settingsData.todayColor,
        thisWeekColor: settingsData.thisWeekColor,
        overdueColor: settingsData.overdueColor,
        todayThreshold: settingsData.todayThreshold,
        thisWeekThreshold: settingsData.thisWeekThreshold,
        twoWeekThreshold: settingsData.twoWeekThreshold,
        spacingLevel: settingsData.spacingLevel
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}