import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import RevenuePlanChart from '@/components/admin/RevenuePlanChart'

export const dynamic = 'force-dynamic'

const PLAN_PRICES = { STARTER: 19.9, PRO: 39.9, PREMIUM: 79.9 }

export default async function AdminReceita() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [activeSubs, recentSubs] = await Promise.all([
    prisma.subscription.findMany({ where: { status: 'active' }, select: { plan: true } }),
    prisma.subscription.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, plan: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0)
  const arr = mrr * 12
  const avgTicket = activeSubs.length > 0 ? mrr / activeSubs.length : 0

  // Group by month for bar chart
  const monthMap = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    monthMap[key] = 0
  }
  for (const s of recentSubs) {
    const key = new Date(s.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (key in monthMap) monthMap[key] += 1
  }

  const monthLabels = Object.keys(monthMap)
  const monthCounts = Object.values(monthMap)

  const topStats = [
    {
      label: 'MRR',
      value: `R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: `${activeSubs.length} assinantes ativos`,
      icon: '💰',
      color: 'green',
    },
    {
      label: 'ARR (Projetado)',
      value: `R$ ${arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: 'MRR × 12',
      icon: '📈',
      color: 'blue',
    },
    {
      label: 'Ticket Médio',
      value: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: 'por assinante/mês',
      icon: '🎯',
      color: 'purple',
    },
  ]

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Receita</h1>
        <p className="admin-page-subtitle">Análise de receita e crescimento</p>
      </div>

      {/* KPI cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {topStats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card-icon stat-card-icon-${s.color}`}>{s.icon}</div>
            <div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <RevenuePlanChart activeSubs={activeSubs} monthLabels={monthLabels} monthCounts={monthCounts} />

      {/* Revenue breakdown table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Receita por Plano</h2>
        </div>
        <div className="admin-card-body">
          {activeSubs.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
              Nenhuma assinatura ativa no momento.
            </p>
          ) : (
            (() => {
              const byPlan = {}
              for (const s of activeSubs) {
                byPlan[s.plan] = (byPlan[s.plan] || 0) + 1
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.entries(byPlan).map(([plan, count]) => {
                    const rev = count * (PLAN_PRICES[plan] || 0)
                    const pct = mrr > 0 ? (rev / mrr) * 100 : 0
                    return (
                      <div key={plan}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '600', color: '#0f172a' }}>{plan}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {count} assinante{count !== 1 ? 's' : ''} × R${' '}
                              {PLAN_PRICES[plan]?.toFixed(2).replace('.', ',') || '?'}
                            </span>
                          </div>
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>
                            R$ {rev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            background: '#f1f5f9',
                            borderRadius: '9999px',
                            height: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              background: '#7c3aed',
                              borderRadius: '9999px',
                              height: '8px',
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          {pct.toFixed(1)}% da receita
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          )}
        </div>
      </div>
    </div>
  )
}
