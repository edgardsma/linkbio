import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const BOOKING_STATUS_BADGE = {
  pending:   'yellow',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue',
}

export default async function AdminSuporte() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  const [totalLeads, recentLeads, recentBookings, recentUsers] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        date: true,
        startTime: true,
        status: true,
        createdAt: true,
        service: { select: { title: true } },
        user: { select: { username: true } },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  const topStats = [
    { label: 'Total de Leads',           value: totalLeads.toLocaleString(),   icon: '📧', color: 'blue'   },
    { label: 'Agendamentos Recentes',     value: recentBookings.length.toLocaleString(), icon: '📅', color: 'purple' },
    { label: 'Novos Usuários (7 dias)',   value: recentUsers.toLocaleString(),  icon: '👤', color: 'green'  },
  ]

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Suporte</h1>
        <p className="admin-page-subtitle">Leads capturados e agendamentos recentes</p>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {topStats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card-icon stat-card-icon-${s.color}`}>{s.icon}</div>
            <div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value" style={{ fontSize: '1.75rem' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Agendamentos Recentes</h2>
          <span className="admin-badge admin-badge-gray">{recentBookings.length} registros</span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Prestador</th>
              <th>Data</th>
              <th>Horário</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{b.guestName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.guestEmail}</div>
                </td>
                <td style={{ color: '#334155' }}>{b.service?.title || '—'}</td>
                <td style={{ color: '#64748b' }}>@{b.user?.username || '—'}</td>
                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(b.date).toLocaleDateString('pt-BR')}
                </td>
                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.startTime}</td>
                <td>
                  <span
                    className={`admin-badge admin-badge-${
                      BOOKING_STATUS_BADGE[b.status] || 'gray'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
            {recentBookings.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">📅</div>
                    <div className="admin-empty-text">Nenhum agendamento encontrado</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Leads table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Leads Recentes</h2>
          <span className="admin-badge admin-badge-gray">{recentLeads.length} de {totalLeads} total</span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Contato</th>
              <th>Telefone</th>
              <th>Usuário</th>
              <th>Mensagem</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {recentLeads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{lead.name || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lead.email}</div>
                </td>
                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{lead.phone || '—'}</td>
                <td style={{ color: '#64748b' }}>@{lead.user?.username || '—'}</td>
                <td
                  style={{
                    maxWidth: '250px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8rem',
                    color: '#475569',
                  }}
                >
                  {lead.message || '—'}
                </td>
                <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {recentLeads.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">📧</div>
                    <div className="admin-empty-text">Nenhum lead capturado ainda</div>
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
