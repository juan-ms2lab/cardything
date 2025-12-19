import { NextRequest, NextResponse } from 'next/server'

const AUTENTICO_URL = process.env.AUTENTICO_URL || 'http://localhost:3041'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    // Proxy to Autentico - validate email verification token
    const response = await fetch(`${AUTENTICO_URL}/api/v1/auth/validate-verification-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: 'cardything',
        token,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return NextResponse.json({
        valid: false,
        error: data.error || 'Invalid or expired token'
      })
    }

    return NextResponse.json({
      valid: true,
      email: data.data?.email
    })
  } catch (error) {
    console.error('Validate registration token error:', error)
    return NextResponse.json({
      valid: false,
      error: 'An error occurred. Please try again later.'
    })
  }
}
