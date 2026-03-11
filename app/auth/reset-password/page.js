'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isTokenValid, setIsTokenValid] = useState(null)
  const [userEmail, setUserEmail] = useState('')

  // Verificar se o token é válido ao carregar a página
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false)
        setError('Token não fornecido')
        return
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setIsTokenValid(true)
          setUserEmail(data.email)
        } else {
          setIsTokenValid(false)
          setError(data.error || 'Token inválido ou expirado')
        }
      } catch (err) {
        setIsTokenValid(false)
        setError('Erro ao verificar token')
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Erro ao resetar senha')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  // Estado de carregamento inicial
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Token inválido
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Link Inválido ou Expirado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'O link de reset de senha é inválido ou expirou.'}
            </p>
            <div className="space-y-4">
              <Link
                href="/auth/forgot-password"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                Solicitar Novo Link de Reset
              </Link>
              <Link
                href="/auth/login"
                className="block text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Voltar para Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Token válido - mostrar formulário de reset
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Resetar Senha
            </h1>
            {userEmail && (
              <p className="text-gray-600 dark:text-gray-400">
                Para: {userEmail}
              </p>
            )}
          </div>

          {/* Success Message */}
          {message ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-4 rounded-lg text-center mb-6">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-semibold">{message}</p>
              <Link
                href="/auth/login"
                className="inline-block mt-4 text-green-600 dark:text-green-400 hover:underline"
              >
                Ir para Login
              </Link>
            </div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mínimo 8 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="•••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
                    disabled={loading}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetando...' : 'Resetar Senha'}
                </button>
              </form>

              {/* Back to Forgot Password */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Link expirado?{' '}
                  <Link href="/auth/forgot-password" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold">
                    Solicitar novo link
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 text-sm"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600'></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
