import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { updateLinkSchema } from '@/lib/validation'
import { prisma } from '@/lib/prisma.js'
import { requireAuth } from '@/lib/auth'
import { createRateLimit } from '@/lib/rate-limit.js'
import { logger, apiLogger } from '@/lib/logger'
import { getRequestId, withRequestId } from '@/lib/middleware'
import { trackPerformance, trackPrismaOperation } from '@/lib/performance'
import { canEditOtherUser, canAccess } from '@/lib/auth.ts'
import { invalidateProfile } from '@/lib/redis'

// Buscar um link específico
export async function GET(request, { params }) {
  const requestId = getRequestId(request)
  const { id } = params

  try {
    apiLogger.debug('Buscar link específico solicitado', { requestId, linkId: id })

    const user = await requireAuth(request)

    const link = await trackPrismaOperation('link.findUnique', async () => {
      return prisma.link.findUnique({
        where: { id },
      })
    })

    if (!link) {
      apiLogger.warn('Link não encontrado', { requestId, linkId: id })
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário pode ver este link
    if (link.userId !== user.id && !canEditOtherUser(user, link.userId)) {
      apiLogger.warn('Acesso negado ao link', { requestId, userId: user.id, linkId: id })
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const response = NextResponse.json(link)
    return withRequestId(response, requestId)
  } catch (error) {
    logger.error('Erro ao buscar link', error, { requestId, linkId: id })
    return NextResponse.json({ error: 'Erro ao buscar link' }, { status: 500 })
  }
}

// Atualizar link
export async function PATCH(request, { params }) {
  return trackPerformance('PATCH /api/links/[id]', async () => {
    const requestId = getRequestId(request)
    const { id } = params

    try {
      apiLogger.info('Atualizar link solicitado', { requestId, linkId: id })

      // Rate limiting
      const identifier = createRateLimit.getIP(request)
      const rateLimitResult = createRateLimit.check(identifier)

      if (rateLimitResult.limited) {
        apiLogger.warn('Rate limit atingido (atualização de link)', { requestId, identifier })
        return NextResponse.json(
          { error: 'Muitas tentativas de atualização. Tente novamente em 1 hora.' },
          {
            status: 429,
            headers: createRateLimit.getHeaders(rateLimitResult),
          }
        )
      }

      const user = await requireAuth(request)

      const link = await trackPrismaOperation('link.findUnique (update)', async () => {
        return prisma.link.findUnique({
          where: { id },
        })
      })

      if (!link) {
        apiLogger.warn('Link não encontrado', { requestId, linkId: id })
        return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
      }

      // Verificar se o usuário pode editar este link
      if (link.userId !== user.id && !canEditOtherUser(user, link.userId)) {
        apiLogger.warn('Acesso negado ao link', { requestId, userId: user.id, linkId: id })
        return NextResponse.json(
          { error: 'Você só pode editar seus próprios links' },
          { status: 403 }
        )
      }

      if (!canAccess(user, '/api/links')) {
        apiLogger.warn('Acesso negado à API de links', { requestId, userId: user.id })
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
      }

      const body = await request.json()

      const parsed = updateLinkSchema.safeParse(body)
      if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors
        apiLogger.warn('Dados inválidos ao atualizar link', { requestId, userId: user.id, linkId: id, errors })
        return NextResponse.json({ error: 'Dados inválidos', details: errors }, { status: 400 })
      }

      const { title, url, description, icon, isActive, position } = parsed.data

      // Atualizar link
      const updatedLink = await trackPrismaOperation('link.update', async () => {
        return prisma.link.update({
          where: { id },
          data: {
            ...(title !== undefined && { title }),
            ...(url !== undefined && { url }),
            ...(description !== undefined && { description }),
            ...(icon !== undefined && { icon }),
            ...(isActive !== undefined && { isActive }),
            ...(position !== undefined && { position }),
          },
        })
      })

      apiLogger.info('Link atualizado com sucesso', {
        requestId,
        userId: user.id,
        linkId: id,
        fieldsUpdated: Object.keys(body),
      })

      // Invalidar cache do perfil público
      if (user.username) {
        await invalidateProfile(user.username)
      }

      const response = NextResponse.json(updatedLink, {
        headers: createRateLimit.getHeaders(rateLimitResult),
      })

      return withRequestId(response, requestId)
    } catch (error) {
      logger.error('Erro ao atualizar link', error, { requestId, linkId: id })
      return NextResponse.json({ error: 'Erro ao atualizar link' }, { status: 500 })
    }
  })
}

// Deletar link
export async function DELETE(request, { params }) {
  return trackPerformance('DELETE /api/links/[id]', async () => {
    const requestId = getRequestId(request)
    const { id } = params

    try {
      apiLogger.info('Deletar link solicitado', { requestId, linkId: id })

      // Rate limiting
      const identifier = createRateLimit.getIP(request)
      const rateLimitResult = createRateLimit.check(identifier)

      if (rateLimitResult.limited) {
        apiLogger.warn('Rate limit atingido (deleção de link)', { requestId, identifier })
        return NextResponse.json(
          { error: 'Muitas tentativas de deleção. Tente novamente em 1 hora.' },
          {
            status: 429,
            headers: createRateLimit.getHeaders(rateLimitResult),
          }
        )
      }

      const user = await requireAuth(request)

      const link = await trackPrismaOperation('link.findUnique (delete)', async () => {
        return prisma.link.findUnique({
          where: { id },
        })
      })

      if (!link) {
        apiLogger.warn('Link não encontrado', { requestId, linkId: id })
        return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
      }

      // Verificar se o usuário pode deletar este link
      if (link.userId !== user.id && !canEditOtherUser(user, link.userId)) {
        apiLogger.warn('Acesso negado ao link', { requestId, userId: user.id, linkId: id })
        return NextResponse.json(
          { error: 'Você só pode deletar seus próprios links' },
          { status: 403 }
        )
      }

      if (!canAccess(user, '/api/links')) {
        apiLogger.warn('Acesso negado à API de links', { requestId, userId: user.id })
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
      }

      // Deletar link
      await trackPrismaOperation('link.delete', async () => {
        return prisma.link.delete({
          where: { id },
        })
      })

      apiLogger.info('Link deletado com sucesso', {
        requestId,
        userId: user.id,
        linkId: id,
      })

      // Invalidar cache do perfil público
      if (user.username) {
        await invalidateProfile(user.username)
      }

      const response = NextResponse.json({ success: true }, {
        headers: createRateLimit.getHeaders(rateLimitResult),
      })

      return withRequestId(response, requestId)
    } catch (error) {
      logger.error('Erro ao deletar link', error, { requestId, linkId: id })
      return NextResponse.json({ error: 'Erro ao deletar link' }, { status: 500 })
    }
  })
}
