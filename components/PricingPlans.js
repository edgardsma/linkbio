'use client'

import { useState } from 'react'
import { useSubscription, usePlans } from '@/hooks/useSubscription'

export default function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const { subscription, redirectToCheckout, openBillingPortal } = useSubscription()
  const { plans, loading } = usePlans()

  const currentPlan = subscription?.subscription?.plan || 'free'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Cabeçalho */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha o plano ideal para você
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Comece gratuitamente e atualize quando precisar
        </p>

        {/* Toggle de Ciclo de Faturamento */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
              billingCycle === 'annual'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Anual
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans &&
          Object.entries(plans).map(([planId, plan]) => (
            <PricingCard
              key={planId}
              planId={planId}
              plan={plan}
              billingCycle={billingCycle}
              currentPlan={currentPlan}
              onSelectPlan={() => redirectToCheckout(planId, billingCycle)}
              onManagePlan={openBillingPortal}
            />
          ))}
      </div>

      {/* Nota */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Todos os planos incluem atualizações gratuitas e suporte por email.
          <br />
          Cancele a qualquer momento sem taxas adicionais.
        </p>
      </div>
    </div>
  )
}

function PricingCard({
  planId,
  plan,
  billingCycle,
  currentPlan,
  onSelectPlan,
  onManagePlan,
}) {
  const isCurrentPlan = currentPlan === planId
  const isUpgrade =
    ['starter', 'pro', 'premium'].indexOf(currentPlan) <
    ['starter', 'pro', 'premium'].indexOf(planId)
  const isPopular = planId === 'pro'

  const price = billingCycle === 'monthly' ? plan.monthly : plan.annual
  const savings = billingCycle === 'annual' ? plan.annual.savings : null

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
        isCurrentPlan ? 'ring-2 ring-purple-600' : ''
      } ${isPopular ? 'border-2 border-purple-600' : ''}`}
    >
      {/* Badge Popular */}
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-purple-600 text-white text-center py-2 text-sm font-semibold">
          Mais Popular
        </div>
      )}

      {/* Conteúdo */}
      <div className={`${isPopular ? 'pt-10' : 'pt-6'} p-6`}>
        {/* Nome do Plano */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-6">{plan.description}</p>

        {/* Preço */}
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">
              R$ {price.price.toFixed(2).replace('.', ',')}
            </span>
            <span className="ml-2 text-gray-600">
              /{billingCycle === 'monthly' ? 'mês' : 'ano'}
            </span>
          </div>
          {savings && (
            <p className="text-sm text-green-600 mt-1 font-medium">
              {savings}
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="ml-3 text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Botão */}
        <button
          onClick={
            isCurrentPlan ? onManagePlan : isUpgrade ? onSelectPlan : null
          }
          disabled={!isCurrentPlan && !isUpgrade}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
            isCurrentPlan
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : isPopular
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } ${!isCurrentPlan && !isUpgrade ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isCurrentPlan
            ? 'Gerenciar Plano'
            : isUpgrade
            ? 'Fazer Upgrade'
            : 'Plano Inferior'}
        </button>

        {isCurrentPlan && (
          <p className="text-center text-xs text-gray-500 mt-2">
            Plano atual • Renova automaticamente
          </p>
        )}
      </div>
    </div>
  )
}
