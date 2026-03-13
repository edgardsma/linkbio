'use client'

import { signOut } from 'next-auth/react'
import { Button } from './Button'

const SUPPORT_EMAIL = 'suporte@linkbiobrasil.com.br'

export default function BlockedScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-br from-indigo-950 to-indigo-900"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-white rounded-xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
        <h1 className="text-2xl font-extrabold text-indigo-950 mb-2">
          Acesso Suspenso
        </h1>
        <p className="text-base font-semibold text-red-600 mb-4">
          Falta de Pagamento
        </p>
        <p className="text-sm text-slate-600 mb-7 leading-relaxed">
          Sua conta foi suspensa por pendência financeira. Entre em contato com o suporte para regularizar sua situação e reativar o acesso.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="block px-4 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition"
          >
            Contatar Suporte
          </a>
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="w-full"
          >
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  )
}
