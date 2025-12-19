import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

const AUTENTICO_URL = process.env.AUTENTICO_URL || 'http://localhost:3041'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password Credentials Provider - calls Autentico
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Call Autentico login endpoint
          const response = await fetch(`${AUTENTICO_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appId: 'cardything',
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Invalid email or password')
          }

          const user = data.data.user

          // Ensure user exists in local database for Prisma adapter
          let localUser = await prisma.user.findUnique({
            where: { id: user.id }
          })

          if (!localUser) {
            // Create user in local database if they don't exist
            localUser = await prisma.user.create({
              data: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
              }
            })

            // Create default board with columns for new user
            await prisma.board.create({
              data: {
                name: 'My Board',
                userId: user.id,
                columns: {
                  create: [
                    { name: 'To Do', position: 0 },
                    { name: 'In Progress', position: 1 },
                    { name: 'Done', position: 2 }
                  ]
                }
              }
            })

            // Create default user settings
            await prisma.userSettings.create({
              data: {
                userId: user.id
              }
            })
          } else {
            // Update local user data if it changed
            if (localUser.name !== user.name || localUser.email !== user.email) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  name: user.name,
                  email: user.email,
                  image: user.image,
                }
              })
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('Autentico login error:', error)
          throw new Error(error instanceof Error ? error.message : 'Invalid email or password')
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub!
      }
    })
  },
  pages: {
    signIn: '/auth/signin'
  }
}
