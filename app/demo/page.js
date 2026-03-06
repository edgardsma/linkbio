'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Demo() {
  const [currentTheme, setCurrentTheme] = useState('purple')

  const themes = {
    purple: {
      bg: 'from-purple-400 to-pink-400',
      button: 'from-purple-500 to-pink-500',
      text: 'text-purple-600'
    },
    blue: {
      bg: 'from-blue-400 to-cyan-400',
      button: 'from-blue-500 to-cyan-500',
      text: 'text-blue-600'
    },
    green: {
      bg: 'from-green-400 to-emerald-400',
      button: 'from-green-500 to-emerald-500',
      text: 'text-green-600'
    },
    orange: {
      bg: 'from-orange-400 to-red-400',
      button: 'from-orange-500 to-red-500',
      text: 'text-orange-600'
    }
  }

  const demoLinks = [
    { title: 'Instagram', url: '#', icon: '📸', type: 'instagram' },
    { title: 'YouTube', url: '#', icon: '📺', type: 'youtube' },
    { title: 'TikTok', url: '#', icon: '🎵', type: 'tiktok' },
    { title: 'Site Oficial', url: '#', icon: '🌐', type: 'website' },
    { title: 'Loja Online', url: '#', icon: '🛍️', type: 'shop' },
    { title: 'Contato', url: '#', icon: '💬', type: 'contact' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            LinkBio Brasil
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors">
              ← Voltar
            </Link>
            <Link href="/auth/signup" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all">
              Criar Minha Página
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Demonstração Interativa
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Veja como sua página personalizada ficará. Experimente diferentes temas!
            </p>
          </div>

          {/* Theme Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Escolha um Tema
            </h3>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setCurrentTheme(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentTheme === key
                      ? 'bg-gradient-to-r ' + theme.button + ' text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Mobile Preview Header */}
            <div className="bg-gray-900 text-white p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-sm mt-2 opacity-75">linkbio-brasil.com/demo</p>
            </div>

            {/* Profile Section */}
            <div className={`bg-gradient-to-br ${themes[currentTheme].bg} text-white p-8 text-center relative overflow-hidden`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-20 h-20 border-2 border-white rounded-full"></div>
                <div className="absolute top-8 right-8 w-16 h-16 border border-white rounded-lg rotate-45"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-full"></div>
              </div>

              {/* Profile Content */}
              <div className="relative z-10">
                <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">👤</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">@SeuUsuario</h2>
                <p className="text-lg opacity-90 mb-4">Criador de Conteúdo | Designer | Empreendedor</p>
                <p className="text-sm opacity-75 max-w-md mx-auto">
                  Bem-vindo ao meu espaço digital! Aqui você encontra todos os meus links importantes.
                  Siga-me nas redes sociais e vamos nos conectar! 🚀
                </p>
              </div>
            </div>

            {/* Links Section */}
            <div className="p-6 space-y-4">
              {demoLinks.map((link, index) => (
                <a
                  key={index}
                  href="#"
                  className={`block w-full p-4 bg-gradient-to-r ${themes[currentTheme].button} text-white rounded-xl font-semibold text-center hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 group`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">{link.icon}</span>
                    <span>{link.title}</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Criado com ❤️ pelo LinkBio Brasil
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Gostou do que viu?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Crie sua própria página personalizada em minutos. É gratuito e não requer conhecimentos técnicos!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className={`px-8 py-4 bg-gradient-to-r ${themes[currentTheme].button} text-white rounded-xl text-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all`}
              >
                Começar Agora - Grátis!
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg border border-gray-200 dark:border-gray-700"
              >
                Ver Todos os Recursos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}