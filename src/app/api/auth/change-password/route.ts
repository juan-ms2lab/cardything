import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const AUTENTICO_URL = process.env.AUTENTICO_URL || 'http://localhost:3041'
const APP_ID = process.env.AUTENTICO_APP_ID || 'cardything'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // First, login to get an access token
    const loginResponse = await fetch(`${AUTENTICO_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: APP_ID,
        email: session.user.email,
        password: currentPassword,
      }),
    })

    const loginData = await loginResponse.json()

    if (!loginResponse.ok || !loginData.success) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    const accessToken = loginData.data.accessToken

    // Now change the password using the access token
    const changeResponse = await fetch(`${AUTENTICO_URL}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    })

    const changeData = await changeResponse.json()

    if (!changeResponse.ok || !changeData.success) {
      return NextResponse.json(
        { error: changeData.error || 'Failed to change password' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while changing password' },
      { status: 500 }
    )
  }
}
