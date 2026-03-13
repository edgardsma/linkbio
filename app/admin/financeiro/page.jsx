import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const PLAN_PRICES = { STARTER: 19.9, PRO: 39.9, PREMIUM: 79.9 }

const STATUS_BADGE = {
  active:     'green',
  canceled:   'red',
  past_due:   'yellow',
  trialing:   'blue',
  incomplete: 'gray',
}

const PLAN_BADGE = {
  FREE:     'gray',
  STARTER:  'purple',
  PRO:      'blue',
  PREMIUM:  'orange',
}

export default async function AdminFinanceiro() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  const allSubs = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true, username: true } },
    },
  })

  const activeSubs   = allSubs.filter((s) => s.status === 'active')
  const canceledSubs = allSubs.filter((s) => s.status === 'canceled')

  const totalRevenue = activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0)

  const stats = [
    {
      label: 'Receita Total (MRR)',
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'green',
    },
    {
      label: 'Assinaturas Ativas',
      value: activeSubs.length.toLocaleString(),
      icon: '✅',
      color: 'blue',
    },
    {
      label: 'Assinaturas Canceladas',
      value: canceledSubs.length.toLocaleString(),
      icon: '❌',
      color: 'red',
    },
  ]

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Financeiro</h1>
        <p className="admin-page-subtitle">Histórico de assinaturas e pagamentos</p>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card-icon stat-card-icon-${s.color}`}>{s.icon}</div>
            <div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* All subscriptions table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Todas as Assinaturas</h2>
          <span className="admin-badge admin-badge-gray">{allSubs.length} registros</span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Receita/mês</th>
              <th>Stripe Customer</th>
              <th>Expira em</th>
              <th>Criado em</th>
            </tr>
          </thead>
          <tbody>
            {allSubs.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{sub.user?.name || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.user?.email}</div>
                </td>
                <td>
                  <span className={`admin-badge admin-badge-${PLAN_BADGE[sub.plan] || 'gray'}`}>
                    {sub.plan || 'FREE'}
                  </span>
                </td>
                <td>
                  <span className={`admin-badge admin-badge-${STATUS_BADGE[sub.status] || 'gray'}`}>
                    {sub.status}
                  </span>
                </td>
                <td style={{ fontWeight: '600', color: '#0f172a' }}>
                  {PLAN_PRICES[sub.plan]
                    ? `R$ ${PLAN_PRICES[sub.plan].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
                <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                  {sub.stripeCustomerId ? sub.stripeCustomerId.slice(0, 20) + '…' : '—'}
                </td>
                <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')
                    : '—'}
                </td>
                <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {allSubs.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">💳</div>
                    <div className="admin-empty-text">Nenhuma assinatura encontrada</div>
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
