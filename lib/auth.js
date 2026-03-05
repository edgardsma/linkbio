import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route.js'
import { verify } from 'jsonwebtoken'
import { prisma } from './prisma.js'
import { headers } from 'next/headers'

/**
 * Função auxiliar para obter a sessão do usuário
 * Suporta autenticação via cookies (NextAuth) ou token JWT (Authorization header)
 */
export async function getSession(request) {
  try {
    // Tenta primeiro usar getServerSession (cookies do NextAuth)
    const session = await getServerSession(authOptions)

    if (session?.user?.email) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        username: session.user.username,
      }
    }

    // Se não tiver sessão via cookie, tenta token JWT via Authorization header
    if (request) {
      const authorization = request.headers.get('authorization')

      if (authorization?.startsWith('Bearer ')) {
        const token = authorization.substring(7) // Remove 'Bearer ' prefixo

        try {
          const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'secret')

          if (decoded?.userId) {
            const user = await prisma.user.findUnique({
              where: { id: decoded.userId },
            })

            if (user) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                username: user.username,
              }
            }
          }
        } catch (tokenError) {
          console.error('Token JWT inválido:', tokenError)
        }
      }
    }

    // Se não tiver sessão via cookie nem token válido, retorna null
    return null
  } catch (error) {
    console.error('Erro ao obter sessão:', error)
    return null
  }
}

/**
 * Função auxiliar para obter o usuário autenticado
 * Retorna o usuário completo do banco de dados
 */
export async function getAuthenticatedUser(request) {
  try {
    const session = await getSession(request)

    if (!session?.email) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
    })

    return user
  } catch (error) {
    console.error('Erro ao obter usuário autenticado:', error)
    return null
  }
}

/**
 * Função para verificar se o usuário está autenticado
 * Lança erro 401 se não estiver autenticado
 */
export async function requireAuth(request) {
  const user = await getAuthenticatedUser(request)

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  return user
}
