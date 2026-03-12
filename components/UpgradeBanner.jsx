'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Ícones ────────────────────────────────────────────────────────────────

const IconClose = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconStar = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const IconLock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

// ─── Lista de features bloqueadas ────────────────────────────────────────────

const PRO_FEATURES = [
  { icon: <IconCheck />, label: 'Links ilimitados', available: false },
  { icon: <IconCheck />, label: 'Templates premium', available: false },
  { icon: <IconCheck />, label: 'Analytics avançados', available: false },
  { icon: <IconCheck />, label: 'Customização total', available: false },
  { icon: <IconLock />, label: 'Domínio personalizado', available: false },
  { icon: <IconLock />, label: 'Remover marca d\'água', available: false },
]

// ─── Componente ─────────────────────────────────────────────────────────────

export default function UpgradeBanner({ currentPlan }) {
  const [dismissed, setDismissed] = useState(false)
  const [closing, setClosing] = useState(false)

  if (currentPlan !== 'free' || dismissed) return null

  const handleDismiss = () => {
    setClosing(true)
    setTimeout(() => setDismissed(true), 300)
  }

  return (
    <div className={`bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg transition-all duration-300 ${closing ? 'opacity-0 scale-95' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2">
            <IconStar />
          </div>
          <div>
            <h3 className="text-lg font-bold">Desbloqueie o poder total</h3>
            <p className="text-emerald-100 text-sm">Upgrade para o plano Pro</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
          title="Fechar"
        >
          <IconClose />
        </button>
      </div>

      <p className="text-white/90 text-sm mb-4">
        Você está usando o plano gratuito. Faça upgrade para desbloquear recursos avançados.
      </p>

      {/* Features */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {PRO_FEATURES.map((feature, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 text-xs ${
              feature.available ? 'text-white/90' : 'text-white/60'
            }`}
          >
            {feature.available ? (
              <IconCheck />
            ) : (
              <IconLock className="w-4 h-4" />
            )}
            <span className={feature.available ? '' : 'line-through'}>{feature.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/pricing"
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition shadow-lg hover:shadow-xl"
        >
          <span>Upgrade para Pro</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <a
          href="https://linkbio.com.br/precos"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
        >
          Ver planos
        </a>
      </div>
    </div>
  )
}
