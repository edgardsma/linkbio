'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const PREMIUM_FEATURES = [
  'Templates ilimitados',
  'Links ilimitados',
  'Analytics avançados',
  'Custom domain',
  'Sem marca d\'água',
  'Suporte prioritário',
]

export default function UpgradeBanner({ userPlan = 'free' }) {
  const [dismissed, setDismissed] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    // Se o usuário já tem plano Pro, não mostrar
    if (userPlan !== 'free' && userPlan !== 'starter') {
      setDismissed(true)
    }
  }, [userPlan])

  const handleDismiss = () => {
    setDismissed(true)
  }

  const handleUpgrade = () => {
    window.location.href = '/dashboard/billing'
  }

  // Se dismissed ou usuário já tem plano Pro, não mostrar
  if (dismissed || userPlan === 'pro' || userPlan === 'premium' || userPlan === 'business') {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Desbloqueie Todo o Potencial
              </h2>
              <p className="text-white/80 text-sm">
                Faça upgrade para o plano Pro e aproveite todos os recursos
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {PREMIUM_FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 0116 0zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-white/90 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpgrade}
              className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-lg hover:bg-green-50 transition-colors shadow-sm"
            >
              Upgrade para Pro
            </button>
            <span className="text-white/80 text-sm">
              Apenas R$19,90/mês
            </span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-4 text-white/60 hover:text-white transition-colors p-1"
          aria-label="Fechar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
