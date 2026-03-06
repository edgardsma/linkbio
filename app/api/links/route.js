import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma.js'
import { requireAuth } from '@/lib/auth.js'
import { createRateLimit, apiRateLimit } from '@/lib/rate-limit.js'
import { logger, apiLogger, dbLogger } from '@/lib/logger'
import { getRequestId, withRequestId } from '@/lib/middleware'
import { trackPerformance, trackPrismaOperation } from '@/lib/performance'

// Buscar todos os links do usuário
export async function GET(request) {
  const requestId = getRequestId()

  try {
    apiLogger.info('Listar links solicitado', { requestId })

    const user = await requireAuth(request)

    const userWithLinks = await trackPrismaOperation('user.findUnique (links)', async () => {
      return prisma.user.findUnique({
        where: { id: user.id },
        include: {
          links: {
            orderBy: { position: 'asc' },
          },
        },
      })
    })

    if (!userWithLinks) {
      apiLogger.warn('Usuário não encontrado', { requestId, userId: user.id })
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    apiLogger.info('Links listados com sucesso', {
      requestId,
      userId: user.id,
      count: userWithLinks.links.length,
    })

    const response = NextResponse.json(userWithLinks.links)
    return withRequestId(response)
  } catch (error) {
    logger.error('Erro ao buscar links', error, { requestId })
    return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 })
  }
}

// Criar novo link
export async function POST(request) {
  return trackPerformance('POST /api/links', async () => {
    const requestId = getRequestId()

    try {
      apiLogger.info('Criar link solicitado', { requestId })

      // Aplicar rate limiting para criação
      const identifier = createRateLimit.getIP(request)
      const rateLimitResult = createRateLimit.check(identifier)

      if (rateLimitResult.limited) {
        apiLogger.warn('Rate limit atingido (criação de link)', { requestId, identifier })
        return NextResponse.json(
          { error: 'Muitas tentativas de criação. Tente novamente em 1 hora.' },
          {
            status: 429,
            headers: createRateLimit.getHeaders(rateLimitResult),
          }
        )
      }

      const user = await requireAuth(request)

      // Verificar limites do plano
      const maxLinks = user.role === 'admin' ? Infinity : user.role === 'agency' ? 100 : 5

      const userWithLinks = await trackPrismaOperation('user.findUnique (create link)', async () => {
        return prisma.user.findUnique({
          where: { id: user.id },
          include: { links: true },
        })
      })

      if (!userWithLinks) {
        apiLogger.warn('Usuário não encontrado', { requestId, userId: user.id })
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      const linkCount = userWithLinks.links.filter(l => l.isActive).length

      if (linkCount >= maxLinks) {
        apiLogger.warn('Limite de links atingido', {
          requestId,
          userId: user.id,
          role: user.role,
          currentCount: linkCount,
          limit: maxLinks,
        })
        return NextResponse.json(
          {
            error: `Limite de ${maxLinks} links atingido`,
            currentPlan: user.role,
            message: 'Faça upgrade para adicionar mais links',
          },
          { status: 403 }
        )
      }

      const body = await request.json()
      const { title, url, description, icon } = body

      // Validações
      const errors = {}

      if (!title) {
        errors.title = 'Título é obrigatório'
      } else if (title.length > 100) {
        errors.title = 'Título deve ter no máximo 100 caracteres'
      }

      if (!url) {
        errors.url = 'URL é obrigatória'
      } else {
        try {
          new URL(url)
        } catch {
          errors.url = 'URL inválida'
        }
      }

      if (description && description.length > 200) {
        errors.description = 'Descrição deve ter no máximo 200 caracteres'
      }

      if (icon && icon.length > 50) {
        errors.icon = 'Ícone deve ter no máximo 50 caracteres'
      }

      if (Object.keys(errors).length > 0) {
        apiLogger.warn('Dados inválidos ao criar link', { requestId, userId: user.id, errors })
        return NextResponse.json(
          { error: 'Dados inválidos', details: errors },
          { status: 400 }
        )
      }

      // Criar link
      const link = await trackPrismaOperation('link.create', async () => {
        return prisma.link.create({
          data: {
            userId: userWithLinks.id,
            title,
            url,
            description: description || null,
            icon: icon || null,
            position: linkCount + 1,
          },
        })
      })

      apiLogger.info('Link criado com sucesso', {
        requestId,
        userId: user.id,
        linkId: link.id,
        title: link.title,
      })

      const response = NextResponse.json(link, {
        status: 201,
        headers: createRateLimit.getHeaders(rateLimitResult),
      })

      return withRequestId(response)
    } catch (error) {
      logger.error('Erro ao criar link', error, { requestId })
      return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 })
    }
  })
}
