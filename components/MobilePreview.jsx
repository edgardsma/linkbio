'use client'

import { useState, useEffect } from 'react'

export default function MobilePreview({ username, links, userTheme }) {
  const [showPreview, setShowPreview] = useState(true)

  // Usar cores do tema ou cores padrão
  const colors = userTheme || {
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f9fafb',
    textColor: '#111827',
  }

  if (!showPreview) {
    return (
      <button
        onClick={() => setShowPreview(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Preview Mobile</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border-2 border-purple-600">
        <div className="p-3 bg-purple-50 dark:bg-purple-900 flex justify-between items-center border-b border-purple-200 dark:border-purple-800">
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Preview Mobile</span>
          <button
            onClick={() => setShowPreview(false)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Celular */}
        <div className="relative">
          {/* Moldura do celular */}
          <div className="w-[300px] h-[600px] bg-gray-900 rounded-[30px] p-2 relative">
            {/* Tela do celular */}
            <div
              className="w-full h-full bg-white dark:bg-gray-800 rounded-[20px] overflow-hidden"
              style={{
                backgroundColor: colors.backgroundColor,
              }}
            >
              {/* Barra de status */}
              <div className="h-6 bg-white dark:bg-gray-900 flex items-center justify-between px-4">
                <span className="text-xs font-medium">9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-black dark:bg-white rounded-full"></div>
                  <div className="w-4 h-4 bg-black dark:bg-white rounded-full"></div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-3 overflow-y-auto" style={{ height: 'calc(100% - 24px)' }}>
                {/* Avatar */}
                {username && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-sm" style={{ color: colors.textColor }}>
                        @{username}
                      </h2>
                    </div>
                  </div>
                )}

                {/* Links */}
                {links && links.length > 0 ? (
                  links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-3 px-4 rounded-lg transition hover:scale-105"
                      style={{
                        backgroundColor: colors.primaryColor,
                        color: colors.backgroundColor,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {link.icon && <span className="flex-shrink-0">{link.icon}</span>}
                          <span className="font-semibold text-sm truncate">{link.title}</span>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="text-center py-12" style={{ color: colors.textColor }}>
                    <p className="text-sm">Nenhum link ainda</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botão home */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-gray-900 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
