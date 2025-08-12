import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
// import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        action: { label: 'Action', type: 'hidden' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { email, name, action } = credentials
        // const password = credentials.password // Not used in demo

        if (action === 'register') {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email }
          })

          if (existingUser) {
            throw new Error('User already exists')
          }

          // Hash password and create user
          // const hashedPassword = await bcrypt.hash(password, 12)
          const user = await prisma.user.create({
            data: {
              email,
              name: name || email.split('@')[0],
              // Note: We'll store password in a separate table in a real app
              // For this demo, we'll handle it in the login flow
            }
          })

          // Create default board and settings
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

          await prisma.userSettings.create({
            data: {
              userId: user.id
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name
          }
        } else {
          // Login logic - for demo purposes, we'll accept any email/password combo
          // In a real app, you'd verify against stored hashed passwords
          let user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {
            // Auto-create user for demo
            user = await prisma.user.create({
              data: {
                email,
                name: name || email.split('@')[0]
              }
            })

            // Create default board and settings
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

            await prisma.userSettings.create({
              data: {
                userId: user.id
              }
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }
      }
    })
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