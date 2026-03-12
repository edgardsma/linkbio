import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { getDaysRemaining } from '@/lib/stripe-helpers'
import SubscriptionBadge from '@/components/SubscriptionBadge'
import StripePortalButton from '@/components/StripePortalButton'

export const metadata = {
  title: 'Faturamento - LinkBio Brasil',
  description: 'Gerencie sua assinatura e pagamentos',
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Não autorizado
          </h1>
          <p className="text-gray-600">Faça login para acessar esta página</p>
        </div>
      </div>
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      links: true,
    },
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Usuário não encontrado
          </h1>
          <p className="text-gray-600">Entre em contato com o suporte</p>
        </div>
      </div>
    )
  }

  const subscription = user.subscription
  const plan = subscription?.plan || 'free'
  const status = subscription?.status || 'active'
  const daysRemaining = subscription?.currentPeriodEnd
    ? getDaysRemaining(subscription)
    : null
  const isCanceled = subscription?.cancelAtPeriodEnd

  const planNames = {
    free: 'Gratuito',
    starter: 'Starter',
    pro: 'Pro',
    premium: 'Premium',
  }

  const planPrices = {
    free: 'R$ 0,00',
    starter: 'R$ 19,90/mês',
    pro: 'R$ 49,90/mês',
    premium: 'R$ 99,90/mês',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Faturamento</h1>
          <p className="text-gray-600 mt-1">
            Gerencie sua assinatura e pagamentos
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações da Assinatura */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Assinatura Atual
              </h2>

              {/* Status Badge */}
              <div className="mb-6">
                <SubscriptionBadge plan={plan} status={status} />
              </div>

              {/* Detalhes do Plano */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Plano</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {planNames[plan]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Preço</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {planPrices[plan]}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Links ativos</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.links.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {status === 'active'
                        ? 'Ativo'
                        : status === 'canceled'
                        ? 'Cancelado'
                        : status === 'past_due'
                        ? 'Em atraso'
                        : status}
                    </p>
                  </div>
                </div>

                {daysRemaining !== null && plan !== 'free' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-900 font-medium">
                          {isCanceled
                            ? 'Sua assinatura será cancelada em'
                            : 'Próxima renovação em'}
                        </p>
                        <p className="text-sm text-blue-700">
                          {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="mt-6 space-y-3">
                {plan === 'free' ? (
                  <>
                    <a
                      href="/dashboard/plans"
                      className="block w-full py-3 px-4 bg-purple-600 text-white text-center rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Fazer Upgrade
                    </a>
                    <a
                      href="/dashboard"
                      className="block w-full py-3 px-4 bg-gray-100 text-gray-700 text-center rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Voltar ao Dashboard
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="/dashboard/plans"
                      className="block w-full py-3 px-4 bg-gray-900 text-white text-center rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      Alterar Plano
                    </a>
                    <StripePortalButton />
                    <a
                      href="/dashboard"
                      className="block w-full py-3 px-4 bg-transparent text-gray-600 text-center rounded-lg font-medium hover:text-gray-900 transition-colors"
                    >
                      Voltar ao Dashboard
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informações
              </h2>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">
                    Você pode cancelar sua assinatura a qualquer momento.
                  </p>
                  <p className="text-gray-500">
                    O acesso continuará até o fim do período atual.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-600 mb-1">
                    Precisa de ajuda com sua assinatura?
                  </p>
                  <a
                    href="mailto:suporte@linkbio.com.br"
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Entre em contato com o suporte
                  </a>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-600 mb-1">
                    Pagamentos processados por
                  </p>
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-purple-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 4.515.858l.66-4.062S16.236 1.6 13.01 1.6c-1.597 0-2.925.421-3.91 1.135-.973.717-1.49 1.753-1.49 3.033 0 2.329 1.822 3.436 4.05 4.375 2.547 1.053 3.535 1.823 3.535 2.79 0 .795-.698 1.435-2.017 1.435-2.814 0-5.392-1.363-5.392-1.363l-.734 4.191s2.688 1.326 5.671 1.326c1.71 0 3.147-.428 4.16-1.176 1.028-.76 1.594-1.866 1.594-3.273 0-2.398-1.864-3.49-4.069-4.416zM24 19.292v-3.736l-3.568-1.244v6.224L24 19.292zM0 14.703l3.568 1.244v6.224L0 20.927v-6.224z" />
                    </svg>
                    <span className="text-gray-700 font-medium">Stripe</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Limites do Plano */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Limites do Plano
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Links máximos</span>
                  <span className="font-medium text-gray-900">
                    {plan === 'free'
                      ? '3'
                      : plan === 'starter'
                      ? '5'
                      : 'Ilimitados'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Temas disponíveis</span>
                  <span className="font-medium text-gray-900">
                    {plan === 'free'
                      ? '1'
                      : plan === 'starter'
                      ? '3'
                      : 'Todos'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Análises</span>
                  <span className="font-medium text-gray-900">
                    {plan === 'free'
                      ? 'Básicas'
                      : plan === 'starter'
                      ? 'Básicas'
                      : plan === 'pro'
                      ? 'Avançadas'
                      : 'Premium'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Domínio personalizado</span>
                  <span
                    className={`font-medium ${
                      plan === 'premium'
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {plan === 'premium' ? 'Disponível' : 'Não disponível'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Acesso à API</span>
                  <span
                    className={`font-medium ${
                      plan === 'premium'
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {plan === 'premium' ? 'Disponível' : 'Não disponível'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
