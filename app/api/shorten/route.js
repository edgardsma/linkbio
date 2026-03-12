import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'
import { createRateLimit } from '@/lib/rate-limit.js'

// Gerar slug aleatório
function generateSlug(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// POST - Criar link curto
export async function POST(request) {
  const requestId = getRequestId(request)

  try {
    const body = await request.json()
    const { url, slug } = body

    // Validação básica
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    // Rate limiting por IP
    const identifier = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
    const rateLimitResult = createRateLimit.check(identifier)
    if (rateLimitResult.limited) {
      logger.warn('Rate limit atingido (encurtamento)', { requestId, identifier })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
        { status: 429, headers: createRateLimit.getHeaders(rateLimitResult) }
      )
    }

    // Verificar sessão do usuário
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id || null

    // Se não tiver slug, gerar aleatório
    let finalSlug = slug
    if (!finalSlug) {
      finalSlug = generateSlug()
    } else {
      // Validar formato do slug customizado
      if (!/^[a-zA-Z0-9_-]+$/.test(finalSlug)) {
        return NextResponse.json(
          { error: 'Slug deve conter apenas letras, números, hífens e underscores' },
          { status: 400 }
        )
      }

      // Verificar se slug já existe
      const existing = await prisma.shortLink.findUnique({
        where: { slug: finalSlug }
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Slug já está em uso' },
          { status: 409 }
        )
      }
    }

    // Para usuários não autenticados, verificar limite de 5 links
    if (!userId) {
      const userIp = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
      const existingLinks = await prisma.shortLink.count({
        where: {
          userId: null,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas
          }
        }
      })

      // Contar por IP não é perfeito mas ajuda no rate limiting
      if (existingLinks >= 5) {
        return NextResponse.json(
          { error: 'Limite de 5 links para não-cadastrados. Crie uma conta para mais!' },
          { status: 403 }
        )
      }
    }

    // Criar ShortLink
    const shortLink = await prisma.shortLink.create({
      data: {
        userId,
        originalUrl: url,
        slug: finalSlug,
      }
    })

    logger.info('Link curto criado com sucesso', {
      requestId,
      userId,
      shortLink,
      slug: finalSlug
    })

    const shortUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/s/${finalSlug}`

    return NextResponse.json({
      id: shortLink.id,
      originalUrl: shortLink.originalUrl,
      slug: shortLink.slug,
      shortUrl,
      clicks: shortLink.clicks,
      createdAt: shortLink.createdAt
    }, { status: 201 })

  } catch (error) {
    logger.error('Erro ao criar link curto', error, { requestId })

    if (error.code === 'P1001') {
      return NextResponse.json({ error: 'Erro de conexão com o banco de dados' }, { status: 503 })
    }

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro ao criar link curto' }, { status: 500 })
  }
}

// GET - Listar links curtos do usuário autenticado
export async function GET(request) {
  const requestId = getRequestId(request)

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const links = await prisma.shortLink.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    const shortUrlBase = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const linksWithShortUrl = links.map(link => ({
      ...link,
      shortUrl: `${shortUrlBase}/s/${link.slug}`
    }))

    logger.info('Links curtos listados', {
      requestId,
      userId: session.user.id,
      count: links.length
    })

    return NextResponse.json(linksWithShortUrl)

  } catch (error) {
    logger.error('Erro ao listar links curtos', error, { requestId })
    return NextResponse.json({ error: 'Erro ao listar links' }, { status: 500 })
  }
}
