import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createLinkSchema } from '@/lib/validation'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'
import { createRateLimit } from '@/lib/rate-limit.js'
import { invalidateProfile } from '@/lib/redis'
// Buscar todos os links do usuário
export async function GET(request) {
  const requestId = getRequestId(request)

  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userWithLinks = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        links: {
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!userWithLinks) {
      logger.warn('Usuário não encontrado', { requestId, userId: session.user.id })
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    logger.info('Links listados com sucesso', {
      requestId,
      userId: session.user.id,
      count: userWithLinks.links.length,
    })

    return NextResponse.json(userWithLinks.links)
  } catch (error) {
    logger.error('Erro ao buscar links', error, { requestId })

    if (error.code === 'P1001') {
      return NextResponse.json({ error: 'Erro de conexão com o banco de dados' }, { status: 503 })
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Time out ao acessar o banco de dados' }, { status: 504 })
    }

    return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 })
  }
}

// Criar novo link
export async function POST(request) {
  const requestId = getRequestId(request)

  // Rate limiting
  const identifier = createRateLimit.getIP(request)
  const rateLimitResult = createRateLimit.check(identifier)
  if (rateLimitResult.limited) {
    logger.warn('Rate limit atingido (criação de link)', { requestId, identifier })
    return NextResponse.json(
      { error: 'Muitas tentativas de criação. Tente novamente em 1 hora.' },
      { status: 429, headers: createRateLimit.getHeaders(rateLimitResult) }
    )
  }

  try {
    const body = await request.json()

    const parsed = createLinkSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      return NextResponse.json({ error: 'Dados inválidos', details: errors }, { status: 400 })
    }

    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const [user, activeLinksCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, username: true } }),
      prisma.link.count({ where: { userId: session.user.id, isActive: true } }),
    ])

    if (!user) {
      logger.warn('Usuário não encontrado', { requestId, userId: session.user.id })
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const maxLinks = 5

    if (activeLinksCount >= maxLinks) {
      return NextResponse.json(
        { error: 'Limite de 5 links atingido. Faça upgrade para adicionar mais links.' },
        { status: 403 }
      )
    }

    const { title, url, description, icon } = parsed.data

    const link = await prisma.link.create({
      data: {
        userId: user.id,
        title,
        url,
        description: description || null,
        icon: icon || null,
        position: activeLinksCount + 1,
      },
    })

    logger.info('Link criado com sucesso', {
      requestId,
      userId: session.user.id,
      linkId: link.id,
      title: link.title,
    })

    // Invalidar cache do perfil público
    if (user.username) {
      await invalidateProfile(user.username)
    }

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    logger.error('Erro ao criar link', error, { requestId })
    return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 })
  }
}
