import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma.js'
import bcrypt from 'bcryptjs'
import { authLogger } from '@/lib/logger'

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
        authLogger.debug('authorize chamado', { email: credentials?.email })

        if (!credentials?.email || !credentials?.password) {
          authLogger.warn('Tentativa de login sem email ou senha')
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        authLogger.debug('Usuário buscado no banco', { found: !!user })

        if (!user || !user.password) {
          authLogger.warn('Usuário não encontrado ou sem senha configurada', { email: credentials?.email })
          return null
        }

        authLogger.debug('Comparando senha')
        // Verificar senha usando bcrypt
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        authLogger.debug('Resultado da comparação de senha', { match: passwordMatch })

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

        authLogger.info('Usuário autenticado com sucesso', { email: result.email })
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
