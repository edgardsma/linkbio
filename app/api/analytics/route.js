import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { requireAuth } from '@/lib/auth.ts'
import { logger, apiLogger } from '@/lib/logger'
import { getRequestId, withRequestId } from '@/lib/middleware'
import { trackPerformance, trackPrismaOperation } from '@/lib/performance'

export function getDateRange(searchParams) {
  const period = searchParams.get('period') || '30d'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const endDate = to ? new Date(to + 'T23:59:59.999Z') : new Date()

  if (from) {
    return { startDate: new Date(from + 'T00:00:00.000Z'), endDate, period: 'custom' }
  }

  const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[period]

  if (!days) {
    // 'all' — desde o início
    return { startDate: new Date('2020-01-01T00:00:00.000Z'), endDate, period: 'all' }
  }

  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
  return { startDate, endDate, period }
}

function fillMissingDays(data, startDate, endDate) {
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24)
  if (daysDiff > 90) {
    // Não preenche lacunas para períodos muito longos
    return data.sort((a, b) => a.date.localeCompare(b.date))
  }

  const map = {}
  data.forEach((d) => { map[d.date] = d.clicks })

  const result = []
  const current = new Date(startDate)
  current.setUTCHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setUTCHours(0, 0, 0, 0)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    result.push({ date: dateStr, clicks: map[dateStr] || 0 })
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return result
}

function parseDevice(ua) {
  if (!ua) return 'desktop'
  const lower = ua.toLowerCase()
  if (lower.includes('ipad') || lower.includes('tablet')) return 'tablet'
  if (lower.includes('mobile') || lower.includes('iphone') || lower.includes('android')) return 'mobile'
  return 'desktop'
}

function parseBrowser(ua) {
  if (!ua) return 'Desconhecido'
  if (ua.includes('Edg/') || ua.includes('Edge/')) return 'Edge'
  if (ua.includes('Chrome/') && !ua.includes('Chromium/') && !ua.includes('Edg/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari'
  if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera'
  return 'Outro'
}

export async function GET(request) {
  return trackPerformance('GET /api/analytics', async () => {
    const requestId = getRequestId()

    try {
      apiLogger.info('Analytics solicitado', { requestId })

      const user = await requireAuth(request)
      if (!user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const { startDate, endDate, period } = getDateRange(searchParams)

      const clickWhere = {
        link: { userId: user.id },
        createdAt: { gte: startDate, lte: endDate },
      }

      const [
        totalLinks,
        totalClicks,
        allLinksRaw,
        clicksByDayRaw,
        geoRaw,
        deviceClicks,
      ] = await Promise.all([
        trackPrismaOperation('link.count', () =>
          prisma.link.count({ where: { userId: user.id, isActive: true } })
        ),

        trackPrismaOperation('click.count', () =>
          prisma.click.count({ where: clickWhere })
        ),

        // Todos os links com contagem de cliques no período
        trackPrismaOperation('link.findMany (all)', () =>
          prisma.link.findMany({
            where: { userId: user.id },
            select: {
              id: true,
              title: true,
              url: true,
              icon: true,
              type: true,
              isActive: true,
              _count: {
                select: {
                  clickLogs: {
                    where: { createdAt: { gte: startDate, lte: endDate } },
                  },
                },
              },
            },
            orderBy: { clicks: 'desc' },
          })
        ),

        // Cliques agrupados por dia (SQL raw para agrupar por data)
        trackPrismaOperation('click.groupByDay', () =>
          prisma.$queryRaw`
            SELECT
              DATE("createdAt") AS date,
              COUNT(*)::int     AS clicks
            FROM "Click"
            WHERE "linkId" IN (
              SELECT id FROM "Link" WHERE "userId" = ${user.id}
            )
            AND "createdAt" >= ${startDate}
            AND "createdAt" <= ${endDate}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `
        ),

        // Geolocalização — top países
        trackPrismaOperation('click.geo', () =>
          prisma.$queryRaw`
            SELECT
              COALESCE(country, 'Desconhecido') AS country,
              COUNT(*)::int                      AS clicks
            FROM "Click"
            WHERE "linkId" IN (
              SELECT id FROM "Link" WHERE "userId" = ${user.id}
            )
            AND "createdAt" >= ${startDate}
            AND "createdAt" <= ${endDate}
            GROUP BY country
            ORDER BY clicks DESC
            LIMIT 10
          `
        ),

        // User-agents para cálculo de dispositivos/browsers
        trackPrismaOperation('click.devices', () =>
          prisma.click.findMany({
            where: clickWhere,
            select: { userAgent: true },
          })
        ),
      ])

      // Processar dispositivos e browsers
      const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 }
      const browserMap = {}
      deviceClicks.forEach(({ userAgent }) => {
        deviceCounts[parseDevice(userAgent)]++
        const b = parseBrowser(userAgent)
        browserMap[b] = (browserMap[b] || 0) + 1
      })

      const browsers = Object.entries(browserMap)
        .map(([browser, clicks]) => ({
          browser,
          clicks,
          percentage: totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)

      // Preencher dias sem cliques
      const clicksByDayNormalized = clicksByDayRaw.map((row) => ({
        date:
          row.date instanceof Date
            ? row.date.toISOString().split('T')[0]
            : String(row.date).split('T')[0],
        clicks: Number(row.clicks),
      }))
      const clicksByDay = fillMissingDays(clicksByDayNormalized, startDate, endDate)

      // Geolocalização com percentual
      const totalGeoClicks = geoRaw.reduce((s, r) => s + Number(r.clicks), 0)
      const geo = geoRaw.map((row) => ({
        country: row.country,
        clicks: Number(row.clicks),
        percentage:
          totalGeoClicks > 0
            ? Math.round((Number(row.clicks) / totalGeoClicks) * 100)
            : 0,
      }))

      // Links com cliques no período
      const allLinks = allLinksRaw
        .map((l) => ({
          id: l.id,
          title: l.title,
          url: l.url,
          icon: l.icon,
          type: l.type,
          isActive: l.isActive,
          clicks: l._count.clickLogs,
        }))
        .sort((a, b) => b.clicks - a.clicks)

      const analytics = {
        summary: {
          totalLinks,
          totalClicks,
          averageClicksPerLink: totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0,
          period,
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
        },
        topLinks: allLinks.slice(0, 5),
        allLinks,
        clicksByDay,
        geo,
        devices: deviceCounts,
        browsers,
      }

      apiLogger.info('Analytics recuperado com sucesso', {
        requestId,
        userId: user.id,
        totalClicks,
        period,
      })

      const response = NextResponse.json(analytics)
      return withRequestId(response)
    } catch (error) {
      logger.error('Erro ao buscar analytics', error, { requestId })
      return NextResponse.json({ error: 'Erro ao buscar analytics' }, { status: 500 })
    }
  })
}
