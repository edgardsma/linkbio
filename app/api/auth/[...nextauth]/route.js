import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma.js'
import bcrypt from 'bcryptjs'
import { authLogger } from '@/lib/logger.js'

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Email e Senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] authorize chamado com email:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Email ou senha vazios')
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        console.log('[AUTH] Usuário encontrado:', !!user)

        if (!user || !user.password) {
          console.log('[AUTH] Usuário não encontrado ou sem senha')
          return null
        }

        console.log('[AUTH] Comparando senha...')
        // Verificar senha usando bcrypt
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        console.log('[AUTH] Senha correspondente:', passwordMatch)

        if (!passwordMatch) {
          return null
        }

        const result = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
        }

        console.log('[AUTH] Retornando usuário:', result.email)
        return result
      },
    }),
    // Provedor Facebook OAuth
    {
      id: 'facebook',
      name: 'Facebook',
      type: 'oauth',
      authorization: {
        url: 'https://www.facebook.com/v19.0/dialog/oauth',
        params: {
          scope: 'email,public_profile',
        },
      },
      token: 'https://graph.facebook.com/v19.0/oauth/access_token',
      userinfo: {
        url: 'https://graph.facebook.com/v19.0/me',
        params: {
          fields: 'id,name,email,picture',
        },
      },
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
        }
      },
    },
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/signup',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.username = token.username
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export const GET = handler
export const POST = handler
export { authOptions }
