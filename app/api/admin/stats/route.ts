/**
 * GET /api/admin/stats
 *
 * Retorna estatísticas gerais da plataforma.
 * Acesso restrito a administradores (protegido pelo root middleware).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { apiLogger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as { user?: { role?: string } } | null

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Buscar estatísticas em paralelo
    const [
      totalUsers,
      totalLinks,
      totalClicks,
      activeLinks,
      newUsersToday,
      newUsersThisMonth,
      usersWithSubscription,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.link.count(),
      prisma.click.count(),
      prisma.link.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.subscription.count({
        where: { status: 'active' },
      }),
    ])

    apiLogger.info('Admin stats consultadas', { requestId })

    return NextResponse.json(
      {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisMonth: newUsersThisMonth,
          withActiveSubscription: usersWithSubscription,
        },
        links: {
          total: totalLinks,
          active: activeLinks,
          inactive: totalLinks - activeLinks,
        },
        clicks: {
          total: totalClicks,
        },
      },
      { headers: { 'x-request-id': requestId } }
    )
  } catch (error) {
    apiLogger.error('Erro ao buscar stats admin', error as Error, { requestId })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    )
  }
}
