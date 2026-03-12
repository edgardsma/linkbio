import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma.js'
import { logger, apiLogger, dbLogger } from '@/lib/logger'
import { getRequestId, withRequestId } from '@/lib/middleware'
import { trackPerformance, trackPrismaOperation } from '@/lib/performance'
import { requireAuth, canAccess } from '@/lib/auth.ts'
import { updateProfileSchema } from '@/lib/validation'
import { invalidateProfile } from '@/lib/redis'

// Buscar perfil do usuário
export async function GET(request) {
  const requestId = getRequestId(request)

  try {
    apiLogger.info('Buscar perfil solicitado', { requestId })

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      apiLogger.warn('Usuário não autenticado', { requestId })
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await trackPrismaOperation('user.findUnique (profile GET)', async () => {
      return prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          bio: true,
          background: true,
          primaryColor: true,
          secondaryColor: true,
          backgroundColor: true,
          textColor: true,
          role: true,
          createdAt: true,
        },
      })
    })

    if (!user) {
      apiLogger.warn('Usuário não encontrado', { requestId, email: session.user.email })
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    apiLogger.info('Perfil buscado com sucesso', {
      requestId,
      userId: user.id,
      email: user.email,
    })

    const response = NextResponse.json(user)
    return withRequestId(response, requestId)
  } catch (error) {
    logger.error('Erro ao buscar perfil', error, { requestId })
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
  }
}

// Atualizar perfil do usuário
export async function PATCH(request) {
  return trackPerformance('PATCH /api/profile', async () => {
    const requestId = getRequestId(request)

    try {
      apiLogger.info('Atualizar perfil solicitado', { requestId })

      const session = await getServerSession(authOptions)

      if (!session?.user?.email) {
        apiLogger.warn('Usuário não autenticado', { requestId })
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }

      const user = await trackPrismaOperation('user.findUnique (profile PATCH)', async () => {
        return prisma.user.findUnique({
          where: { email: session.user.email },
        })
      })

      if (!user) {
        apiLogger.warn('Usuário não encontrado', { requestId, email: session.user.email })
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      if (!canAccess(user, '/api/profile')) {
        apiLogger.warn('Acesso negado à API de perfil', { requestId, userId: user.id })
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
      }

      const body = await request.json()

      const parsed = updateProfileSchema.safeParse(body)
      if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors
        apiLogger.warn('Dados inválidos ao atualizar perfil', { requestId, userId: user.id, errors })
        return NextResponse.json({ error: 'Dados inválidos', details: errors }, { status: 400 })
      }

      const { name, username, bio, image, background, primaryColor, secondaryColor, backgroundColor, textColor } = parsed.data

      // Verificar se o username já está em uso (se estiver sendo alterado)
      if (username && username !== user.username) {
        const existingUser = await trackPrismaOperation('user.findUnique (username check)', async () => {
          return prisma.user.findUnique({
            where: { username },
          })
        })

        if (existingUser) {
          apiLogger.warn('Username já em uso', {
            requestId,
            userId: user.id,
            attemptedUsername: username,
          })
          return NextResponse.json(
            { error: 'Este nome de usuário já está em uso' },
            { status: 400 }
          )
        }
      }

      // Atualizar usuário
      const updatedUser = await trackPrismaOperation('user.update', async () => {
        return prisma.user.update({
          where: { id: user.id },
          data: {
            ...(name !== undefined && { name }),
            ...(username !== undefined && { username }),
            ...(bio !== undefined && { bio }),
            ...(image !== undefined && { image }),
            ...(background !== undefined && { background }),
            ...(primaryColor !== undefined && { primaryColor }),
            ...(secondaryColor !== undefined && { secondaryColor }),
            ...(backgroundColor !== undefined && { backgroundColor }),
            ...(textColor !== undefined && { textColor }),
          },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            bio: true,
            background: true,
            role: true,
          },
        })
      })

      apiLogger.info('Perfil atualizado com sucesso', {
        requestId,
        userId: user.id,
        fieldsUpdated: Object.keys(body),
      })

      // Invalidar cache do perfil (username antigo e novo, caso tenha mudado)
      await Promise.all([
        invalidateProfile(user.username),
        username && username !== user.username ? invalidateProfile(username) : Promise.resolve(),
      ])

      const response = NextResponse.json(updatedUser)
      return withRequestId(response, requestId)
    } catch (error) {
      logger.error('Erro ao atualizar perfil', error, { requestId })
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }
  })
}
