import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  // Rota pública: busca serviços por username (para o widget de agendamento)
  if (username) {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const services = await prisma.bookingService.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    })
    return Response.json({ services, userId: user.id })
  }

  // Rota autenticada
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const services = await prisma.bookingService.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { bookings: true } } },
  })

  return Response.json({ services })
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { title, description, duration, price, color, maxPerDay } = body

  if (!title || !duration) {
    return Response.json({ error: 'Título e duração são obrigatórios' }, { status: 400 })
  }

  const service = await prisma.bookingService.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      duration: parseInt(duration),
      price: parseInt(price || 0),
      color: color || '#667eea',
      maxPerDay: parseInt(maxPerDay || 10),
    },
  })

  return Response.json({ service }, { status: 201 })
}
