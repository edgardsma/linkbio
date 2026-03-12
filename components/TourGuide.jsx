'use client'

import { useEffect, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function TourGuide() {
  const startTour = () => {
    console.log('Starting tour...')
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
            description: 'Clique aqui para adicionar seu primeiro link.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-templates',
          popover: {
            title: '🎨 Templates',
            description: 'Clique aqui para acessar a galeria de templates.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-analytics',
          popover: {
            title: '📊 Analytics',
            description: 'Acompanhe quantos cliques seus links estão recebendo.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-share-url',
          popover: {
            title: '📤 Compartilhar',
            description: 'Copie sua URL pública e compartilhe.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-upgrade',
          popover: {
            title: '⭐ Upgrade',
            description: 'Desbloqueie recursos avançados do plano Pro.',
            side: 'left',
            align: 'center',
          },
        },
      ],
    })

    driverObj.drive()
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button
        onClick={startTour}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-bold text-xl shadow-2xl animate-bounce-slow"
        style={{ zIndex: 99999 }}
      >
        🔔 Iniciar Tour Guide
      </button>
    </div>
  )
}
