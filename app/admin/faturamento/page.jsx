import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const PLAN_PRICES = {
  STARTER: 19.9,
  PRO: 39.9,
  PREMIUM: 79.9,
}

export default async function AdminFaturamento() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: 'active' },
    select: { plan: true, createdAt: true },
  })

  // MRR por plano
  const mrrByPlan = activeSubscriptions.reduce((acc, sub) => {
    const price = PLAN_PRICES[sub.plan] || 0
    acc[sub.plan] = (acc[sub.plan] || { count: 0, mrr: 0 })
    acc[sub.plan].count += 1
    acc[sub.plan].mrr += price
    return acc
  }, {})

  const totalMRR = Object.values(mrrByPlan).reduce((sum, p) => sum + p.mrr, 0)
  const totalARR = totalMRR * 12

  // Assinaturas por mês (últimos 6 meses)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const recentSubs = await prisma.subscription.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, plan: true },
    orderBy: { createdAt: 'asc' },
  })

  // Agrupar por mês
  const byMonth = recentSubs.reduce((acc, sub) => {
    const key = new Date(sub.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Faturamento</h1>
        <p className="text-gray-600">Receita recorrente da plataforma</p>
      </div>

      {/* Métricas de Receita */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-2">MRR (Receita Mensal)</p>
          <p className="text-3xl font-bold text-green-600">
            R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">{activeSubscriptions.length} assinaturas ativas</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-2">ARR (Receita Anual Projetada)</p>
          <p className="text-3xl font-bold text-blue-600">
            R$ {totalARR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">MRR × 12</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-2">Ticket Médio</p>
          <p className="text-3xl font-bold text-purple-600">
            R$ {activeSubscriptions.length > 0
              ? (totalMRR / activeSubscriptions.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
              : '0,00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">por assinante/mês</p>
        </div>
      </div>

      {/* Receita por Plano */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Receita por Plano</h2>
        {Object.keys(mrrByPlan).length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma assinatura ativa no momento.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(mrrByPlan).map(([plan, data]) => {
              const pct = totalMRR > 0 ? (data.mrr / totalMRR) * 100 : 0
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{plan}</span>
                      <span className="text-sm text-gray-500">({data.count} assinantes × R$ {PLAN_PRICES[plan]?.toFixed(2).replace('.', ',') || '?'})</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      R$ {data.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{pct.toFixed(1)}% da receita total</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Novas Assinaturas por Mês */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Novas Assinaturas (últimos 6 meses)</h2>
        {Object.keys(byMonth).length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma assinatura nos últimos 6 meses.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {Object.entries(byMonth).map(([month, count]) => (
              <div key={month} className="text-center">
                <p className="text-2xl font-bold text-purple-600">{count}</p>
                <p className="text-xs text-gray-500 mt-1">{month}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preços de Referência */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tabela de Preços</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(PLAN_PRICES).map(([plan, price]) => (
            <div key={plan} className="border border-gray-200 rounded-xl p-4 text-center">
              <p className="font-semibold text-gray-900 mb-1">{plan}</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {price.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-gray-500">por mês</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
