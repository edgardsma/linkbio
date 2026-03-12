import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, name, phone, message, linkId } = body

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    // Buscar o owner do link para associar o lead
    if (!linkId) {
      return Response.json({ error: 'linkId é obrigatório' }, { status: 400 })
    }

    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    })

    if (!link) {
      return Response.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    const lead = await prisma.lead.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        message: message?.trim() || null,
        linkId,
        userId: link.userId,
      },
    })

    return Response.json({ success: true, id: lead.id }, { status: 201 })
  } catch (error) {
    console.error('[leads] Erro ao salvar lead:', error)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Importação dinâmica para evitar ciclo com auth
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/route')
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          link: { select: { title: true } },
        },
      }),
      prisma.lead.count({ where: { userId: session.user.id } }),
    ])

    return Response.json({
      leads,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[leads] Erro ao buscar leads:', error)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
