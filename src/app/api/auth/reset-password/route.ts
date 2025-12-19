import { NextRequest, NextResponse } from 'next/server'

const AUTENTICO_URL = process.env.AUTENTICO_URL || 'http://localhost:3041'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    // Proxy to Autentico
    const response = await fetch(`${AUTENTICO_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: 'cardything',
        token,
        newPassword,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return NextResponse.json({
        success: false,
        error: data.error || 'Failed to reset password'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred. Please try again later.'
    })
  }
}
