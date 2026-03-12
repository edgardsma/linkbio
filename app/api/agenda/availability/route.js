import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const userId = searchParams.get('userId')

  // Rota pública
  const targetUserId = userId || (username
    ? (await prisma.user.findUnique({ where: { username }, select: { id: true } }))?.id
    : null)

  if (targetUserId) {
    const availability = await prisma.availability.findMany({
      where: { userId: targetUserId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    })
    return Response.json({ availability })
  }

  // Rota autenticada
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const availability = await prisma.availability.findMany({
    where: { userId: session.user.id },
    orderBy: { dayOfWeek: 'asc' },
  })

  return Response.json({ availability })
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { availability } = await request.json()
  // availability: Array<{ dayOfWeek: number, startTime: string, endTime: string, isActive: boolean }>

  if (!Array.isArray(availability)) {
    return Response.json({ error: 'Formato inválido' }, { status: 400 })
  }

  // Upsert cada dia
  const results = await Promise.all(
    availability.map(({ dayOfWeek, startTime, endTime, isActive }) =>
      prisma.availability.upsert({
        where: { userId_dayOfWeek: { userId: session.user.id, dayOfWeek } },
        create: { userId: session.user.id, dayOfWeek, startTime, endTime, isActive: isActive ?? true },
        update: { startTime, endTime, isActive: isActive ?? true },
      })
    )
  )

  return Response.json({ availability: results })
}
