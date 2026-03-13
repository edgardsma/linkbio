import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    color: '#64748b',
    bgColor: '#f8fafc',
    features: [
      '5 links',
      'Página básica',
      'Analytics básico',
      'Suporte por email',
    ],
    limits: { links: 5 },
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 19.9,
    color: '#7c3aed',
    bgColor: '#faf5ff',
    features: [
      '20 links',
      'Temas premium',
      'Analytics avançado',
      'QR Code personalizado',
      'Remoção de branding',
    ],
    limits: { links: 20 },
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 39.9,
    color: '#2563eb',
    bgColor: '#eff6ff',
    features: [
      'Links ilimitados',
      'Agendamento de consultas',
      'Captura de leads',
      'Domínio personalizado',
      'Integrações (Hotmart, Kiwify)',
      'Suporte prioritário',
    ],
    limits: { links: -1 },
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 79.9,
    color: '#ea580c',
    bgColor: '#fff7ed',
    features: [
      'Tudo do Pro',
      'Multi-usuário / Agency',
      'Acesso à API',
      'White-label completo',
      'Suporte dedicado',
      'SLA garantido',
    ],
    limits: { links: -1 },
  },
]

export default async function AdminPlanos() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  // Count subscribers per plan
  const subCounts = await prisma.subscription.groupBy({
    by: ['plan'],
    where: { status: 'active' },
    _count: true,
  })

  const countMap = {}
  for (const s of subCounts) {
    countMap[s.plan] = s._count
  }

  const totalUsers = await prisma.user.count()
  const totalWithSub = subCounts.reduce((sum, s) => sum + s._count, 0)
  const freeUsers = totalUsers - totalWithSub

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Planos</h1>
        <p className="admin-page-subtitle">
          Configuração de planos e assinantes atuais
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {PLANS.map((plan) => {
          const subscribers =
            plan.id === 'FREE' ? freeUsers : (countMap[plan.id] || 0)

          return (
            <div
              key={plan.id}
              className="plan-card"
              style={{ borderColor: plan.bgColor !== '#f8fafc' ? plan.color + '33' : '#e2e8f0' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div className="plan-card-name">{plan.name}</div>
                <span
                  style={{
                    background: plan.bgColor,
                    color: plan.color,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                  }}
                >
                  {subscribers} usuário{subscribers !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="plan-card-price" style={{ color: plan.color }}>
                {plan.price === 0 ? (
                  'Grátis'
                ) : (
                  <>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                    <span>/mês</span>
                  </>
                )}
              </div>

              <ul className="plan-card-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              <div
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                }}
              >
                {plan.limits.links === -1 ? 'Links ilimitados' : `Até ${plan.limits.links} links`}
                {plan.price > 0 && (
                  <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>
                    · configurado via Stripe
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="admin-card"
        style={{ padding: '1.25rem 1.5rem', background: '#fffbeb', borderColor: '#fde68a' }}
      >
        <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
          ⚠️ Os preços e recursos dos planos pagos são gerenciados via{' '}
          <strong>Stripe Dashboard</strong>. Alterações nos IDs de produtos/preços devem
          ser refletidas nas variáveis de ambiente <code>STRIPE_*</code>.
        </p>
      </div>
    </div>
  )
}
