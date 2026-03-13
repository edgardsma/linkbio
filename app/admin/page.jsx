import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import AdminDashboardCharts from '@/components/admin/AdminDashboardCharts'

export const dynamic = 'force-dynamic'

const PLAN_PRICES = { STARTER: 19.9, PRO: 39.9, PREMIUM: 79.9 }

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  const [totalUsers, totalLinks, totalClicks, activeSubscriptions, recentUsers, newUsersRaw] =
    await Promise.all([
      prisma.user.count(),
      prisma.link.count(),
      prisma.click.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          subscription: { select: { plan: true, status: true } },
        },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { createdAt: true },
      }),
    ])

  // MRR
  const activeSubs = await prisma.subscription.findMany({
    where: { status: 'active' },
    select: { plan: true },
  })
  const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0)

  // Users per day (last 7 days)
  const dayLabels = []
  const dayCounts = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' })
    const count = newUsersRaw.filter((u) => {
      const ud = new Date(u.createdAt)
      return ud.toDateString() === d.toDateString()
    }).length
    dayLabels.push(label)
    dayCounts.push(count)
  }

  const stats = [
    { label: 'Total de Usuários',    value: totalUsers.toLocaleString('pt-BR'),  icon: '👥', color: 'purple' },
    { label: 'MRR',                  value: `R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: '💰', color: 'green' },
    { label: 'Assinaturas Ativas',   value: activeSubscriptions.toLocaleString(), icon: '💳', color: 'blue'   },
    { label: 'Total de Cliques',     value: totalClicks.toLocaleString('pt-BR'), icon: '👆', color: 'orange' },
  ]

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Visão geral da plataforma</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-card-icon stat-card-icon-${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="admin-stat-label">{stat.label}</div>
              <div
                className="admin-stat-value"
                style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}
              >
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts (client component) */}
      <AdminDashboardCharts dayLabels={dayLabels} dayCounts={dayCounts} activeSubs={activeSubs} />

      {/* Recent users */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Usuários Recentes</h2>
          <a href="/admin/usuarios" style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: '500' }}>
            Ver todos →
          </a>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Username</th>
              <th>Plano</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{u.name || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                </td>
                <td style={{ color: '#64748b' }}>@{u.username || '—'}</td>
                <td>
                  <span
                    className={`admin-badge admin-badge-${
                      u.subscription?.status === 'active' ? 'purple' : 'gray'
                    }`}
                  >
                    {u.subscription?.plan || 'FREE'}
                  </span>
                </td>
                <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">👥</div>
                    <div className="admin-empty-text">Nenhum usuário encontrado</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
