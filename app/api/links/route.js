import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma-simple'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'

// Buscar todos os links do usuário
export async function GET(request) {
  const requestId = getRequestId()

  try {
    // Verificar sessão
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

    const response = NextResponse.json(userWithLinks.links)
    return response
  } catch (error) {
    logger.error('Erro ao buscar links', error, { requestId })

    // Verificar se é erro de conexão com banco
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 503 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Time out ao acessar o banco de dados' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao buscar links' },
      { status: 500 }
    )
  }
}

// Criar novo link
export async function POST(request) {
  const requestId = getRequestId()

  try {
    const body = await request.json()

    // Validações básicas
    if (!body.title) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.url) {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      )
    }

    if (body.title.length > 100) {
      return NextResponse.json(
        { error: 'Título deve ter no máximo 100 caracteres' },
        { status: 400 }
      )
    }

    // Verificar sessão
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar usuário com contagem de links
    const userWithLinks = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { links: true },
    })

    if (!userWithLinks) {
      logger.warn('Usuário não encontrado', { requestId, userId: session.user.id })
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Contar links ativos
    const activeLinksCount = userWithLinks.links.filter(l => l.isActive).length

    // Limite de links baseado no plano (FREE = 5 links)
    const maxLinks = 5

    if (activeLinksCount >= maxLinks) {
      return NextResponse.json(
        { error: 'Limite de 5 links atingido. Faça upgrade para adicionar mais links.' },
        { status: 403 }
      )
    }

    // Criar link
    const link = await prisma.link.create({
      data: {
        userId: userWithLinks.id,
        title: body.title,
        url: body.url,
        description: body.description || null,
        icon: body.icon || null,
        position: activeLinksCount + 1,
      },
    })

    logger.info('Link criado com sucesso', {
      requestId,
      userId: session.user.id,
      linkId: link.id,
      title: link.title,
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    logger.error('Erro ao criar link', error, { requestId })

    return NextResponse.json(
      { error: 'Erro ao criar link' },
      { status: 500 }
    )
  }
}
