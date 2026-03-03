'use client'

import { useState } from 'react'

export default function SubscriptionLimitAlert({
  plan,
  maxLinks,
  currentLinks,
  feature,
  onUpgrade,
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const percentage = (currentLinks / maxLinks) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = currentLinks >= maxLinks

  if (feature) {
    return (
      <FeatureLimitAlert plan={plan} feature={feature} onUpgrade={onUpgrade} />
    )
  }

  return (
    <div
      className={`rounded-lg border ${
        isAtLimit
          ? 'bg-red-50 border-red-200'
          : isNearLimit
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-blue-50 border-blue-200'
      } p-4`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 ${
            isAtLimit
              ? 'text-red-600'
              : isNearLimit
              ? 'text-yellow-600'
              : 'text-blue-600'
          }`}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isAtLimit ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
          </svg>
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          {isAtLimit ? (
            <>
              <h4 className="text-sm font-semibold text-red-900 mb-1">
                Limite atingido
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Você atingiu o limite de {maxLinks} links no plano{' '}
                {plan === 'free' ? 'gratuito' : plan}. Faça upgrade para continuar
                adicionando links.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {isNearLimit ? 'Quase no limite' : 'Uso de links'}
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                Você está usando {currentLinks} de {maxLinks} links disponíveis no
                plano {plan === 'free' ? 'gratuito' : plan}.
              </p>
            </>
          )}

          {/* Barra de Progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full transition-all ${
                isAtLimit
                  ? 'bg-red-600'
                  : isNearLimit
                  ? 'bg-yellow-600'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Botão de Upgrade */}
          <button
            onClick={onUpgrade}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isAtLimit
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isAtLimit ? 'Fazer Upgrade Agora' : 'Ver Planos'}
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Detalhes */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-900 mt-2"
          >
            {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>

          {isExpanded && (
            <div className="mt-3 text-sm text-gray-600 space-y-2">
              <p>
                <strong>Starter:</strong> Até 5 links
                <br />
                <strong>Pro:</strong> Links ilimitados
                <br />
                <strong>Premium:</strong> Links ilimitados + recursos exclusivos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FeatureLimitAlert({ plan, feature, onUpgrade }) {
  const featureNames = {
    customDomain: 'Domínio Personalizado',
    apiAccess: 'Acesso à API',
    advancedAnalytics: 'Análises Avançadas',
    customThemes: 'Temas Customizados',
    premiumThemes: 'Temas Premium Exclusivos',
  }

  const requiredPlans = {
    customDomain: 'premium',
    apiAccess: 'premium',
    advancedAnalytics: 'pro',
    customThemes: 'pro',
    premiumThemes: 'premium',
  }

  const requiredPlan = requiredPlans[feature] || 'premium'
  const currentPlan = plan || 'free'

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-purple-600">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-purple-900 mb-1">
            Funcionalidade Premium
          </h4>
          <p className="text-sm text-purple-700 mb-3">
            {featureNames[feature]} está disponível apenas no plano{' '}
            {requiredPlan === 'premium' ? 'Premium' : requiredPlan === 'pro' ? 'Pro' : 'Starter'}
            .
          </p>

          <button
            onClick={onUpgrade}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            Ver Planos
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
