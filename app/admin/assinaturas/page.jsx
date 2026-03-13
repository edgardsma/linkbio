import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

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

export default async function AdminAssinaturas() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: {
        select: { name: true, email: true, username: true },
      },
    },
  })

  const byStatus = subscriptions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {})

  const byPlan = subscriptions.reduce((acc, s) => {
    const plan = s.plan || 'FREE'
    acc[plan] = (acc[plan] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Assinaturas</h1>
        <p className="admin-page-subtitle">{subscriptions.length} assinaturas registradas</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Por Status</h2>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`admin-badge admin-badge-${STATUS_BADGE[status] || 'gray'}`}>
                  {status}
                </span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{count}</span>
              </div>
            ))}
            {Object.keys(byStatus).length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Nenhuma assinatura</p>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Por Plano</h2>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(byPlan).map(([plan, count]) => (
              <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`admin-badge admin-badge-${PLAN_BADGE[plan] || 'gray'}`}>
                  {plan}
                </span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{count}</span>
              </div>
            ))}
            {Object.keys(byPlan).length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Nenhum plano ativo</p>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Stripe ID</th>
              <th>Expira em</th>
              <th>Criado em</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
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
                <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                  {sub.stripeCustomerId ? sub.stripeCustomerId.slice(0, 18) + '…' : '—'}
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
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6}>
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
