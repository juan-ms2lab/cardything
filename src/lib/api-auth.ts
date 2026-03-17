import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Authenticate an API request via API key.
 * Supports: Authorization: Bearer <key> or X-API-Key: <key>
 * Returns the userId if valid, null otherwise.
 */
export async function authenticateApiKey(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  const apiKeyHeader = request.headers.get('x-api-key')

  let key: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    key = authHeader.slice(7)
  } else if (apiKeyHeader) {
    key = apiKeyHeader
  }

  if (!key) return null

  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    select: { userId: true, id: true }
  })

  if (!apiKey) return null

  // Update lastUsed (fire and forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date() }
  }).catch(() => {})

  return apiKey.userId
}
