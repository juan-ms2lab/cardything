import { NextRequest, NextResponse } from 'next/server'

const AUTENTICO_URL = process.env.AUTENTICO_URL || 'http://localhost:3041'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Proxy to Autentico
    const response = await fetch(`${AUTENTICO_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: 'cardything',
        email,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to process request' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      message: data.message || 'If an account with that email exists, we have sent password reset instructions.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
