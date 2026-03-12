'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getOnboardingProgress } from '@/lib/onboarding'

// ─── Tipos (inline para evitar TypeScript) ────────────────────────────────────

// ─── Ícones ────────────────────────────────────────────────────────────────

const IconClose = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const IconProgress = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// ─── Componente ─────────────────────────────────────────────────────────────

export default function OnboardingChecklist({
  status,
  onDismiss,
  userId,
}) {
  const [closing, setClosing] = useState(false)

  const progress = getOnboardingProgress(status)

  const handleDismiss = async () => {
    if (!status.canDismiss) return
    setClosing(true)
    await fetch('/api/onboarding/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setTimeout(() => onDismiss(), 300)
  }

  if (status.isComplete) return null

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-5 transition-all duration-300 ${closing ? 'opacity-0 scale-95' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Configure sua página
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete {status.completedCount} de {status.totalCount} passos para maximizar seu perfil
          </p>
        </div>
        {status.canDismiss && (
          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            title="Fechar"
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Lista de etapas */}
      <div className="space-y-2">
        {status.steps.map((step) => (
          <Link
            key={step.id}
            href={step.action || '#'}
            onClick={(e) => {
              if (!step.action) e.preventDefault()
            }}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              step.completed
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm'
            }`}
          >
            {/* Ícone */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                step.completed
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}
            >
              {step.completed ? <IconCheck /> : step.icon}
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium ${
                  step.completed
                    ? 'text-green-700 dark:text-green-400 line-through'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {step.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {step.description}
              </p>
            </div>

            {/* Seta para etapas não completadas */}
            {step.action && !step.completed && (
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Link>
        ))}
      </div>

      {/* Footer - aviso se não pode fechar */}
      {!status.canDismiss && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Complete pelo menos 3 etapas para poder fechar este checklist
        </p>
      )}
    </div>
  )
}
