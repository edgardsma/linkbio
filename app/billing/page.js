'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('payments')

  useEffect(() => {
    if (session?.user?.id) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados de faturamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async (invoiceId) => {
    if (!session?.user?.id) return

    try {
      // Em produção, você implementaria download da fatura do Stripe
      // Por enquanto, vamos apenas mostrar um alerta
      alert(`Download da fatura ${invoiceId} será implementado na produção`)
    } catch (error) {
      console.error('Erro ao baixar fatura:', error)
    }
  }

  const formatCurrency = (amount, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }

  const getPlanName = (plan) => {
    const plans = {
      free: 'Grátis',
      starter: 'Starter',
      pro: 'Pro',
      premium: 'Premium',
    }
    return plans[plan] || plan || 'Desconhecido'
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Ativa', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      pending: { text: 'Pendente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
      canceled: { text: 'Cancelada', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      past_due: { text: 'Atrasada', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
      trialing: { text: 'Teste', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    }
    return badges[status] || { text: status, className: 'bg-gray-100 text-gray-700' }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso não autorizado</h1>
          <button
            onClick={() => router.push('/auth/login')}
            className="text-purple-600 hover:underline"
          >
            Faça login para continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            LinkBio Brasil
          </a>
          <nav className="flex gap-4 items-center">
            <a
              href="/dashboard"
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Dashboard
            </a>
            <a
              href="/profile"
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Perfil
            </a>
            <a
              href="/billing"
              className="text-purple-600 dark:text-purple-400 font-semibold"
            >
              Faturamento
            </a>
            <span className="text-gray-600 dark:text-gray-300">{session.user?.name}</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Histórico de Pagamentos
        </h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'payments'
                ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Pagamentos
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'subscriptions'
                ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Assinaturas
          </button>
        </div>

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {payments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m0 0-6 0h13a6 6 0-0 0-6 12m0 6 0-0 6M19 19a6 6 0 0 0-6-12 6m6" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum pagamento encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Você ainda não tem pagamentos registrados.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {payment.subscription?.plan ? `Plano ${getPlanName(payment.subscription.plan)}` : 'Pagamento único'}
                            </p>
                            {payment.stripeInvoiceId && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Fatura: #{payment.stripeInvoiceId}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status).className}`}>
                            {getStatusBadge(payment.status).text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {payment.stripeInvoiceId && (
                            <button
                              onClick={() => handleDownloadInvoice(payment.stripeInvoiceId)}
                              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                            >
                              Baixar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {subscriptions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m0 0-6 0h13a6 6 0 0 0-6 12m0 6 0-0 6M19 19a6 6 0 0 0-6-12 6m6" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhuma assinatura encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Você ainda não tem assinaturas registradas.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
                  >
                    {/* Header */}
                    <div className={`px-6 py-4 ${subscription.status === 'active' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Plano {getPlanName(subscription.plan)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {formatCurrency(subscription.planValue)}
                            {subscription.priceDetails?.interval === 'month' ? '/mês' : subscription.priceDetails?.interval === 'year' ? '/ano' : ''}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(subscription.status).className}`}>
                          {getStatusBadge(subscription.status).text}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Início:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(subscription.currentPeriodStart)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Fim:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(subscription.currentPeriodEnd)}
                        </span>
                      </div>
                      {subscription.status === 'active' && subscription.daysRemaining > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Renova em:
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {subscription.daysRemaining} dias
                          </span>
                        </div>
                      )}
                      {subscription.status === 'canceled' && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Cancelada em:
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(subscription.cancelAtPeriodEnd)}
                          </span>
                        </div>
                      )}
                      {subscription.cancelAtPeriodEnd && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                          Cancela ao fim do período atual. Você pode reativar a qualquer momento.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                      <button
                        onClick={() => router.push('/dashboard/plans')}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                      >
                        Mudar Plano
                      </button>
                      {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                        <button
                          onClick={() => alert('Funcionalidade de cancelamento será implementada na próxima versão')}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                        >
                          Cancelar Assinatura
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Card */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Resumo
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Pago:
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(
                    payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Pagamentos:
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {payments.filter(p => p.status === 'succeeded').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Assinatura Ativa:
                </span>
                <span className={`text-lg font-bold ${subscriptions.find(s => s.status === 'active') ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                  {subscriptions.find(s => s.status === 'active') ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-4">
              <a
                href="/dashboard/plans"
                className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-center"
              >
                Ver Planos
              </a>
              <a
                href="/profile"
                className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-center"
              >
                Editar Perfil
              </a>
              <a
                href="https://dashboard.stripe.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-center"
              >
                Portal Stripe
              </a>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Suporte
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Precisa de ajuda com sua conta ou assinatura?
              </p>
              <a
                href="mailto:suporte@linkbio.com.br"
                className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-center"
              >
                Entrar em Contato
              </a>
              <a
                href="/dashboard"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-center"
              >
                Voltar ao Dashboard
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
