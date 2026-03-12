import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createCalendarEvent } from '@/lib/gcalendar'
import { sendEmail } from '@/lib/email'

export async function POST(request) {
  const body = await request.json()
  const { userId, serviceId, guestName, guestEmail, guestPhone, date, startTime, notes } = body

  if (!userId || !serviceId || !guestName || !guestEmail || !date || !startTime) {
    return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  // Validar e-mail
  if (!guestEmail.includes('@')) {
    return Response.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  // Buscar serviço
  const service = await prisma.bookingService.findUnique({
    where: { id: serviceId },
    include: { user: { select: { name: true, email: true, googleCalendarToken: true } } },
  })

  if (!service || service.userId !== userId || !service.isActive) {
    return Response.json({ error: 'Serviço indisponível' }, { status: 404 })
  }

  // Calcular horário de fim
  const [h, m] = startTime.split(':').map(Number)
  const endMinutes = h * 60 + m + service.duration
  const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

  // Verificar conflito de horário
  const bookingDate = new Date(date + 'T00:00:00.000Z')
  const conflict = await prisma.booking.findFirst({
    where: {
      userId,
      date: bookingDate,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        { startTime: { lte: startTime }, endTime: { gt: startTime } },
        { startTime: { lt: endTime }, endTime: { gte: endTime } },
        { startTime: { gte: startTime }, endTime: { lte: endTime } },
      ],
    },
  })

  if (conflict) {
    return Response.json({ error: 'Horário não disponível' }, { status: 409 })
  }

  // Criar booking
  const booking = await prisma.booking.create({
    data: {
      userId,
      serviceId,
      guestName: guestName.trim(),
      guestEmail: guestEmail.toLowerCase().trim(),
      guestPhone: guestPhone?.trim() || null,
      date: bookingDate,
      startTime,
      endTime,
      notes: notes?.trim() || null,
      status: service.price === 0 ? 'confirmed' : 'pending',
    },
    include: { service: true, user: { select: { name: true, email: true } } },
  })

  // Google Calendar (opcional - só se o owner conectou)
  if (booking.status === 'confirmed' && service.user.googleCalendarToken) {
    try {
      const eventId = await createCalendarEvent({
        token: service.user.googleCalendarToken,
        title: `${service.title} - ${guestName}`,
        description: `Agendamento via LinkBio Brasil\nCliente: ${guestName}\nE-mail: ${guestEmail}${guestPhone ? `\nWhatsApp: ${guestPhone}` : ''}${notes ? `\nObs: ${notes}` : ''}`,
        date,
        startTime,
        endTime,
        guestEmail,
      })
      await prisma.booking.update({ where: { id: booking.id }, data: { calendarEventId: eventId } })
    } catch (err) {
      console.warn('[bookings] Google Calendar falhou (não crítico):', err.message)
    }
  }

  // E-mail de confirmação (opcional)
  try {
    await sendBookingConfirmationEmail(booking, service)
  } catch (err) {
    console.warn('[bookings] E-mail falhou (não crítico):', err.message)
  }

  return Response.json({ booking }, { status: 201 })
}

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = {
    userId: session.user.id,
    ...(status ? { status } : {}),
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { service: { select: { title: true, duration: true, price: true, color: true } } },
    }),
    prisma.booking.count({ where }),
  ])

  return Response.json({ bookings, total, page, pages: Math.ceil(total / limit) })
}

async function sendBookingConfirmationEmail(booking, service) {
  const { sendEmail } = await import('@/lib/email').catch(() => ({ sendEmail: null }))
  if (!sendEmail) return

  const dateFormatted = new Date(booking.date).toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  await sendEmail({
    to: booking.guestEmail,
    subject: `✅ Agendamento confirmado: ${service.title}`,
    html: `
      <h2>Agendamento Confirmado!</h2>
      <p>Olá, <strong>${booking.guestName}</strong>!</p>
      <p>Seu agendamento foi confirmado com sucesso.</p>
      <table>
        <tr><td><strong>Serviço:</strong></td><td>${service.title}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${dateFormatted}</td></tr>
        <tr><td><strong>Horário:</strong></td><td>${booking.startTime} - ${booking.endTime}</td></tr>
        ${booking.notes ? `<tr><td><strong>Obs:</strong></td><td>${booking.notes}</td></tr>` : ''}
      </table>
      <p>Caso precise cancelar ou reagendar, entre em contato.</p>
    `,
  })
}
