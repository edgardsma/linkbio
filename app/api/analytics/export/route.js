import { requireAuth } from '@/lib/auth.ts'
import { prisma } from '@/lib/prisma.js'
import { getDateRange } from '../route.js'

export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { startDate, endDate, period } = getDateRange(searchParams)
    const format = searchParams.get('format') || 'csv'

    const links = await prisma.link.findMany({
      where: { userId: user.id },
      select: {
        title: true,
        url: true,
        type: true,
        isActive: true,
        clicks: true,
        _count: {
          select: {
            clickLogs: {
              where: { createdAt: { gte: startDate, lte: endDate } },
            },
          },
        },
      },
      orderBy: { position: 'asc' },
    })

    const rows = links.map((l) => ({
      title: l.title,
      url: l.url,
      type: l.type,
      active: l.isActive,
      totalClicks: l.clicks,
      periodClicks: l._count.clickLogs,
    }))

    if (format === 'json') {
      return Response.json({
        period,
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        links: rows,
      })
    }

    // CSV
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`
    const header = ['Link', 'URL', 'Tipo', 'Ativo', 'Total Cliques', `Cliques (${period})`]
    const csvRows = [
      header.join(','),
      ...rows.map((r) =>
        [
          escape(r.title),
          escape(r.url),
          r.type,
          r.active ? 'Sim' : 'Não',
          r.totalClicks,
          r.periodClicks,
        ].join(',')
      ),
    ]

    const filename = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    return new Response('\uFEFF' + csvRows.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar analytics:', error)
    return Response.json({ error: 'Erro ao exportar' }, { status: 500 })
  }
}
