import { NextRequest, NextResponse } from 'next/server'

const AUTENTICO_URL = process.env.AUTENTICO_URL || 'http://localhost:3041'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Proxy to Autentico - password is optional (two-step flow if not provided)
    const response = await fetch(`${AUTENTICO_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: 'cardything',
        email,
        password: password || undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Registration failed' },
        { status: response.status }
      )
    }

    // Pass through Autentico response including existingUser flags
    return NextResponse.json({
      message: data.message || 'If this email is not already registered, you will receive a verification link shortly. Please check your inbox.',
      success: data.success !== false,
      existingUser: data.data?.existingUser || false,
      canLoginNow: data.data?.canLoginNow || false,
      requiresApproval: data.data?.requiresApproval || false,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
