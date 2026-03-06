import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { requireAuth, isAdmin, canViewAnalytics } from '@/lib/auth.ts'
import { logger, apiLogger } from '@/lib/logger'
import { getRequestId, withRequestId } from '@/lib/middleware'
import { trackPerformance, trackPrismaOperation } from '@/lib/performance'

// Buscar analytics do usuário
export async function GET(request) {
  return trackPerformance('GET /api/analytics', async () => {
    const requestId = getRequestId()

    try {
      apiLogger.info('Analytics solicitado', { requestId })

      const user = await requireAuth(request)

      if (!user) {
        apiLogger.warn('Acesso negado ao analytics - não autenticado', { requestId })
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }

      // Buscar analytics
      const [totalLinks, totalClicks, topLinks, clicksByDay] = await Promise.all([
        trackPrismaOperation('link.count (analytics)', async () => {
          return prisma.link.count({
            where: { userId: user.id, isActive: true },
          })
        }),
        trackPrismaOperation('click.count (total)', async () => {
          return prisma.click.count({
            where: {
              link: { userId: user.id },
            },
          })
        }),
        trackPrismaOperation('link.findMany (top)', async () => {
          return prisma.link.findMany({
            where: { userId: user.id, isActive: true },
            orderBy: { clicks: 'desc' },
            take: 5,
            select: {
              id: true,
              title: true,
              url: true,
              clicks: true,
              createdAt: true,
            },
          })
        }),
        trackPrismaOperation('click.groupBy (byDay)', async () => {
          return prisma.click.groupBy({
            by: ['createdAt'],
            where: {
              link: { userId: user.id },
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
              },
            },
            _count: true,
            orderBy: { createdAt: 'desc' },
          })
        }),
      ])

      apiLogger.info('Analytics recuperado com sucesso', {
        requestId,
        userId: user.id,
        totalLinks,
        totalClicks,
      })

      const analytics = {
        summary: {
          totalLinks,
          totalClicks,
          averageClicksPerLink: totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0,
        },
        topLinks,
        clicksByDay: clicksByDay.map((item) => ({
          date: item.createdAt.toISOString().split('T')[0],
          clicks: item._count,
        })),
      }

      const response = NextResponse.json(analytics)
      return withRequestId(response)
    } catch (error) {
      logger.error('Erro ao buscar analytics', error, { requestId })
      return NextResponse.json({ error: 'Erro ao buscar analytics' }, { status: 500 })
    }
  })
}
