import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id }
    })

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settingsData = await request.json()

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
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
        userId: session.user.id,
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