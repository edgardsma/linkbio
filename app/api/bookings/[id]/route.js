import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const { status, cancelReason } = await request.json()

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking || booking.userId !== session.user.id) {
    return Response.json({ error: 'Agendamento não encontrado' }, { status: 404 })
  }

  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    cancelled: [],
    completed: [],
  }

  if (!validTransitions[booking.status]?.includes(status)) {
    return Response.json({
      error: `Não é possível mudar de "${booking.status}" para "${status}"`,
    }, { status: 400 })
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status,
      cancelReason: status === 'cancelled' ? (cancelReason || null) : undefined,
    },
    include: { service: { select: { title: true } } },
  })

  return Response.json({ booking: updated })
}

export async function GET(request, { params }) {
  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: { select: { title: true, duration: true, price: true, description: true } },
      user: { select: { name: true, username: true, image: true } },
    },
  })

  if (!booking) return Response.json({ error: 'Não encontrado' }, { status: 404 })

  return Response.json({ booking })
}
