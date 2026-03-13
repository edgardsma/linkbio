'use client'

import { useRouter } from 'next/navigation'

/**
 * Botão de voltar universal — funciona em desktop, Android e iOS.
 * @param {string} fallback  URL para ir caso não haja histórico de navegação.
 * @param {string} label     Texto do botão (padrão: "Voltar").
 * @param {string} className Classes extras.
 */
export default function BackButton({ fallback = '/', label = 'Voltar', className = '' }) {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }

  return (
    <button
      onClick={handleBack}
      aria-label={label}
      className={`inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  )
}
