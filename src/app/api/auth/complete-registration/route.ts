import { NextRequest, NextResponse } from 'next/server'

const AUTENTICO_URL = process.env.AUTENTICO_URL || 'http://localhost:3041'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, password } = body

    // Complete registration via Autentico's verify-email endpoint
    const response = await fetch(`${AUTENTICO_URL}/api/v1/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: 'cardything',
        token,
        name,
        password,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return NextResponse.json({
        success: false,
        error: data.error || 'Failed to complete registration'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully'
    })
  } catch (error) {
    console.error('Complete registration error:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred. Please try again later.'
    })
  }
}
