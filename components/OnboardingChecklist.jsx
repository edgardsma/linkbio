'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const STEPS = [
  {
    id: 1,
    title: 'Adicionar foto de perfil',
    description: 'Coloque uma foto para as pessoas te reconhecerem',
    icon: '📸',
    action: '/dashboard/profile',
  },
  {
    id: 2,
    title: 'Adicionar primeiro link',
    description: 'Comece adicionando um link importante',
    icon: '🔗',
    action: '/dashboard',
  },
  {
    id: 3,
    title: 'Escolher template',
    description: 'Personalize o visual da sua página',
    icon: '🎨',
    action: '/templates',
  },
  {
    id: 4,
    title: 'Compartilhar perfil',
    description: 'Divulgue sua página nas redes sociais',
    icon: '📤',
    action: null,
    copyAction: true,
  },
  {
    id: 5,
    title: 'Conectar rede social',
    description: 'Adicione links do Instagram, TikTok, etc.',
    icon: '📱',
    action: '/dashboard',
  },
  {
    id: 6,
    title: 'Ativar plano Pro',
    description: 'Desbloqueie recursos avançados',
    icon: '⭐',
    action: '/dashboard/billing',
    isPremium: true,
  },
]

export default function OnboardingChecklist({ user }) {
  const { data: session } = useSession()
  const [completedSteps, setCompletedSteps] = useState([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (user?.onboardingDismissed) {
      setDismissed(true)
    }

    // Verificar quais etapas estão completas
    const steps = []
    
    // Etapa 1: Foto de perfil
    if (user?.image) {
      steps.push(1)
    }

    // Etapa 2: Primeiro link
    if (user?.links && user.links.length > 0) {
      steps.push(2)
    }

    // Etapa 3: Template escolhido
    if (user?.themeId) {
      steps.push(3)
    }

    setCompletedSteps(steps)
  }, [user])

  const handleDismiss = async () => {
    try {
      await fetch('/api/onboarding/dismiss', {
        method: 'POST',
      })
      setDismissed(true)
    } catch (error) {
      console.error('Erro ao dismiss onboarding:', error)
    }
  }

  const handleCopyProfileLink = async () => {
    const url = `${window.location.origin}/${user.username}`
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copiado para a área de transferência!')
    } catch (error) {
      alert('Erro ao copiar link')
    }
  }

  const progress = (completedSteps.length / STEPS.length) * 100

  // Se dismissed ou todas completas, não mostrar
  if (dismissed || completedSteps.length === STEPS.length) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Complete seu perfil</h2>
          <p className="text-white/80 text-sm">
            Siga as etapas para maximizar sua página
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Progresso</span>
          <span className="font-semibold">{completedSteps.length}/{STEPS.length}</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Lista de etapas */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id)
          
          return (
            <div
              key={step.id}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                isCompleted
                  ? 'bg-white/20'
                  : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              {/* Ícone */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  isCompleted ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>

              {/* Conteúdo */}
              <div className="flex-grow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-white/80">{step.description}</p>
                  </div>
                  {step.isPremium && (
                    <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-semibold">
                      PRO
                    </span>
                  )}
                </div>

                {/* Ação */}
                {step.copyAction ? (
                  <button
                    onClick={handleCopyProfileLink}
                    className="mt-3 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
                  >
                    Copiar Link
                  </button>
                ) : !isCompleted && step.action ? (
                  <a
                    href={step.action}
                    className="inline-block mt-3 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
                  >
                    Fazer Agora
                  </a>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
