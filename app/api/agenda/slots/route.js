import { prisma } from '@/lib/prisma'

/**
 * GET /api/agenda/slots?userId=X&serviceId=Y&date=YYYY-MM-DD
 * Retorna horários disponíveis para um serviço em uma data específica
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const serviceId = searchParams.get('serviceId')
  const dateStr = searchParams.get('date') // "2026-03-15"

  if (!userId || !serviceId || !dateStr) {
    return Response.json({ error: 'userId, serviceId e date são obrigatórios' }, { status: 400 })
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return Response.json({ error: 'Data inválida' }, { status: 400 })
  }

  const dayOfWeek = date.getDay()

  // 1. Buscar disponibilidade do dia
  const avail = await prisma.availability.findUnique({
    where: { userId_dayOfWeek: { userId, dayOfWeek } },
  })

  if (!avail || !avail.isActive) {
    return Response.json({ slots: [], reason: 'Sem disponibilidade neste dia' })
  }

  // 2. Buscar serviço para saber duração
  const service = await prisma.bookingService.findUnique({
    where: { id: serviceId },
    select: { duration: true, maxPerDay: true },
  })

  if (!service) {
    return Response.json({ error: 'Serviço não encontrado' }, { status: 404 })
  }

  // 3. Buscar bookings já existentes nesta data
  const startOfDay = new Date(dateStr + 'T00:00:00.000Z')
  const endOfDay = new Date(dateStr + 'T23:59:59.999Z')

  const existingBookings = await prisma.booking.findMany({
    where: {
      userId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { in: ['pending', 'confirmed'] },
    },
    select: { startTime: true, endTime: true },
  })

  // 4. Gerar slots disponíveis
  const slots = generateSlots(avail.startTime, avail.endTime, service.duration, existingBookings)

  // 5. Verificar limite por dia
  if (existingBookings.length >= service.maxPerDay) {
    return Response.json({ slots: [], reason: 'Limite de agendamentos do dia atingido' })
  }

  return Response.json({ slots })
}

function generateSlots(startTime, endTime, durationMinutes, existingBookings) {
  const slots = []
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  let current = startH * 60 + startM
  const end = endH * 60 + endM

  while (current + durationMinutes <= end) {
    const slotStart = minutesToTime(current)
    const slotEnd = minutesToTime(current + durationMinutes)

    const isOccupied = existingBookings.some(b => {
      const [bStartH, bStartM] = b.startTime.split(':').map(Number)
      const [bEndH, bEndM] = b.endTime.split(':').map(Number)
      const bStart = bStartH * 60 + bStartM
      const bEnd = bEndH * 60 + bEndM
      return current < bEnd && (current + durationMinutes) > bStart
    })

    if (!isOccupied) {
      slots.push({ startTime: slotStart, endTime: slotEnd })
    }

    current += durationMinutes
  }

  return slots
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
