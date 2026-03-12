'use client'

import { useEffect, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function TourGuide() {
  const [showTour, setShowTour] = useState(false)
  const [tourDismissed, setTourDismissed] = useState(false)

  useEffect(() => {
    // Verificar se usuário já viu o tour
    const dismissed = localStorage.getItem('tour_dismissed')
    if (!dismissed) {
      // Mostrar botão de iniciar tour após um pequeno delay
      setTimeout(() => setShowTour(true), 2000)
    }
    setTourDismissed(!!dismissed)
  }, [])

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      stepsPerView: 3,
      prevBtnText: 'Anterior',
      nextBtnText: 'Próximo',
      doneBtnText: 'Concluir',
      closeBtnText: 'Fechar',
      progressText: '{{current}} de {{total}}',
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      popoverClass: 'tour-popover',
      steps: [
        {
          element: '#tour-add-link',
          popover: {
            title: '🔗 Adicionar Link',
            description: 'Clique aqui para adicionar seu primeiro link. Você pode adicionar Instagram, WhatsApp, YouTube e muito mais!',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-templates',
          popover: {
            title: '🎨 Templates Visuais',
            description: 'Clique aqui para acessar a galeria de templates e escolher um visual profissional para sua página.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-analytics',
          popover: {
            title: '📊 Analytics',
            description: 'Acompanhe aqui quantos cliques seus links estão recebendo. Analytics detalhados disponíveis no plano Pro.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-share-url',
          popover: {
            title: '📤 Compartilhar Perfil',
            description: 'Copie sua URL pública e compartilhe no Instagram, TikTok, LinkedIn e outras redes sociais.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-upgrade',
          popover: {
            title: '⭐ Upgrade para Pro',
            description: 'Desbloqueie recursos avançados como analytics detalhados, links ilimitados e templates premium.',
            side: 'left',
            align: 'center',
          },
        },
      ],
    })

    driverObj.drive()
  }

  const dismissTour = () => {
    localStorage.setItem('tour_dismissed', 'true')
    setTourDismissed(true)
    setShowTour(false)
  }

  // Não mostrar se usuário já viu o tour
  if (tourDismissed) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showTour && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-2xl p-4 max-w-xs animate-bounce-slow">
          <div className="flex items-start gap-3">
            <div className="text-3xl">👋</div>
            <div className="flex-1">
              <h4 className="font-bold mb-1">Primeira vez aqui?</h4>
              <p className="text-sm text-purple-100 mb-3">
                Queremos te mostrar como usar o LinkBio!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={startTour}
                  className="flex-1 bg-white text-purple-700 px-3 py-2 rounded-lg font-bold text-sm hover:bg-purple-50 transition"
                >
                  Iniciar Tour
                </button>
                <button
                  onClick={dismissTour}
                  className="px-3 py-2 text-purple-200 hover:text-white transition text-sm font-medium"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Botão flutuante para reiniciar o tour */}
      {!showTour && (
        <button
          onClick={startTour}
          className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-full p-3 shadow-lg hover:shadow-xl transition border-2 border-purple-200 dark:border-purple-800"
          title="Ver tour novamente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </div>
  )
}
