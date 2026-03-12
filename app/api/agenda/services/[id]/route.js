import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const service = await prisma.bookingService.findUnique({ where: { id } })
  if (!service || service.userId !== session.user.id) {
    return Response.json({ error: 'Serviço não encontrado' }, { status: 404 })
  }

  const updated = await prisma.bookingService.update({
    where: { id },
    data: {
      title: body.title?.trim() ?? service.title,
      description: body.description?.trim() ?? service.description,
      duration: body.duration ? parseInt(body.duration) : service.duration,
      price: body.price !== undefined ? parseInt(body.price) : service.price,
      color: body.color ?? service.color,
      isActive: body.isActive ?? service.isActive,
      maxPerDay: body.maxPerDay ? parseInt(body.maxPerDay) : service.maxPerDay,
    },
  })

  return Response.json({ service: updated })
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params

  const service = await prisma.bookingService.findUnique({ where: { id } })
  if (!service || service.userId !== session.user.id) {
    return Response.json({ error: 'Serviço não encontrado' }, { status: 404 })
  }

  await prisma.bookingService.delete({ where: { id } })
  return Response.json({ success: true })
}
