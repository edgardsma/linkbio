import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminContas() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  const agencyUsers = await prisma.user.findMany({
    where: { role: 'agency' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true } },
      _count: { select: { links: true } },
    },
  })

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Contas Agency</h1>
        <p className="admin-page-subtitle">
          {agencyUsers.length} conta{agencyUsers.length !== 1 ? 's' : ''} com role agency
        </p>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Conta</th>
              <th>Username</th>
              <th>Assinatura</th>
              <th>Links</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {agencyUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}
                    >
                      {(u.name || u.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#0f172a' }}>{u.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#64748b' }}>@{u.username || '—'}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span
                      className={`admin-badge admin-badge-${
                        u.subscription?.status === 'active' ? 'purple' : 'gray'
                      }`}
                    >
                      {u.subscription?.plan || 'FREE'}
                    </span>
                    {u.subscription?.status && (
                      <span
                        className={`admin-badge admin-badge-${
                          u.subscription.status === 'active' ? 'green' : 'red'
                        }`}
                      >
                        {u.subscription.status}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      background: '#f3e8ff',
                      color: '#7c3aed',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                    }}
                  >
                    {u._count?.links ?? 0} links
                  </span>
                </td>
                <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {agencyUsers.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">🏢</div>
                    <div className="admin-empty-text">Nenhuma conta agency encontrada</div>
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
