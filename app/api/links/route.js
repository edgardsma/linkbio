import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { canAddLinks } from '@/lib/stripe-helpers'
import { requireAuth } from '@/lib/auth.js'
import { createRateLimit, apiRateLimit } from '@/lib/rate-limit.js'

// Buscar todos os links do usuário
export async function GET(request) {
  try {
    const user = await requireAuth(request)

    const userWithLinks = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        links: {
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!userWithLinks) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(userWithLinks.links)
  } catch (error) {
    console.error('Erro ao buscar links:', error)
    return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 })
  }
}

// Criar novo link
export async function POST(request) {
  try {
    // Aplicar rate limiting para criação
    const identifier = createRateLimit.getIP(request)
    const rateLimitResult = createRateLimit.check(identifier)

    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: 'Muitas tentativas de criação. Tente novamente em 1 hora.' },
        {
          status: 429,
          headers: createRateLimit.getHeaders(rateLimitResult),
        }
      )
    }

    const user = await requireAuth(request)

    const userWithLinks = await prisma.user.findUnique({
      where: { id: user.id },
      include: { links: true },
    })

    if (!userWithLinks) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
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
      return NextResponse.json(
        { error: 'Dados inválidos', details: errors },
        { status: 400 }
      )
    }

    // Verificar limite de links do plano
    const canAdd = await canAddLinks(userWithLinks.id, userWithLinks.links.length)
    if (!canAdd) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: userWithLinks.id },
      })
      const plan = subscription?.plan || 'FREE'
      return NextResponse.json(
        {
          error: 'Limite de links atingido',
          currentPlan: plan,
          message: 'Faça upgrade para adicionar mais links',
        },
        { status: 403 }
      )
    }

    // Criar link
    const link = await prisma.link.create({
      data: {
        userId: userWithLinks.id,
        title,
        url,
        description: description || null,
        icon: icon || null,
        position: userWithLinks.links.length,
      },
    })

    return NextResponse.json(link, {
      status: 201,
      headers: createRateLimit.getHeaders(rateLimitResult),
    })
  } catch (error) {
    console.error('Erro ao criar link:', error)
    return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 })
  }
}
