import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { canAddLinks } from '@/lib/stripe-helpers'

// Buscar todos os links do usuário
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        links: {
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(user.links)
  } catch (error) {
    console.error('Erro ao buscar links:', error)
    return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 })
  }
}

// Criar novo link
export async function POST(request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { links: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { title, url, description, icon } = body

    // Validações
    if (!title || !url) {
      return NextResponse.json({ error: 'Título e URL são obrigatórios' }, { status: 400 })
    }

    // Validação de URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    // Verificar limite de links do plano
    const canAdd = await canAddLinks(user.id, user.links.length)
    if (!canAdd) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
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
        userId: user.id,
        title,
        url,
        description: description || null,
        icon: icon || null,
        position: user.links.length,
      },
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar link:', error)
    return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 })
  }
}
