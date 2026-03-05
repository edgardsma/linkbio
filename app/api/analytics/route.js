import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { requireAuth } from '@/lib/auth.js'

// Buscar dados de analytics do usuário
export async function GET(request) {
  try {
    const user = await requireAuth(request)

    const userWithLinks = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!userWithLinks) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Total de cliques
    const totalClicks = await prisma.click.count({
      where: {
        link: {
          userId: userWithLinks.id,
        },
      },
    })

    // Cliques por link
    const clicksByLink = userWithLinks.links.map(link => ({
      id: link.id,
      title: link.title,
      clicks: link.clicks,
    }))

    // Distribuição por hora (últimas 24 horas)
    const clicksByHour = []
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date()
      hourStart.setHours(hourStart.getHours() - i, 0, 0, 0)

      const hourEnd = new Date(hourStart)
      hourEnd.setHours(hourEnd.getHours() + 1)

      const count = await prisma.click.count({
        where: {
          link: { userId: userWithLinks.id },
          createdAt: {
            gte: hourStart,
            lt: hourEnd,
          },
        },
      })

      clicksByHour.push({
        hour: hourStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        clicks: count,
      })
    }

    // Distribuição por dia (últimos 7 dias)
    const clicksByDay = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date()
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const count = await prisma.click.count({
        where: {
          link: { userId: userWithLinks.id },
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      })

      clicksByDay.push({
        day: dayStart.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        clicks: count,
      })
    }

    // Top links com percentual
    const sortedLinks = [...clicksByLink].sort((a, b) => b.clicks - a.clicks)
    const topLinks = sortedLinks.map(link => ({
      ...link,
      percentage: totalClicks > 0 ? Math.round((link.clicks / totalClicks) * 100) : 0,
    }))

    return NextResponse.json({
      totalClicks,
      totalLinks: userWithLinks.links.length,
      totalActiveLinks: userWithLinks.links.filter(l => l.isActive).length,
      clicksByLink,
      clicksByHour,
      clicksByDay,
      topLinks: topLinks.slice(0, 10),
    })
  } catch (error) {
    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json({ error: 'Erro ao buscar analytics' }, { status: 500 })
  }
}
