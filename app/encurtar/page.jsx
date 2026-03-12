'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ShortenPublicPage() {
  const [formData, setFormData] = useState({
    url: '',
    slug: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [linksCreated, setLinksCreated] = useState(0)

  // Verificar limite de links (simulado - na prática viria do localStorage ou API)
  const checkLimit = () => {
    const created = parseInt(localStorage.getItem('shortLinksCreated') || '0')
    const createdToday = parseInt(localStorage.getItem('shortLinksCreatedToday') || '0')
    const lastDate = localStorage.getItem('shortLinksLastDate')

    const today = new Date().toDateString()

    // Resetar contador se mudou o dia
    if (lastDate !== today) {
      localStorage.setItem('shortLinksLastDate', today)
      localStorage.setItem('shortLinksCreatedToday', '0')
      return 0
    }

    return createdToday
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setLoading(true)

    try {
      const createdToday = checkLimit()

      if (createdToday >= 5) {
        setError('Limite de 5 links por dia para usuários não cadastrados. <a href="/auth/signup" class="text-purple-600 hover:underline">Crie uma conta</a> para encurtar mais!')
        setLoading(false)
        return
      }

      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar link')
      }

      // Atualizar contadores
      const newCount = createdToday + 1
      localStorage.setItem('shortLinksCreatedToday', newCount.toString())
      localStorage.setItem('shortLinksLastDate', new Date().toDateString())
      setLinksCreated(newCount)

      setSuccess(data)
      setFormData({ url: '', slug: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Link copiado!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              LB
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">
              LinkBio <span className="text-purple-600">Brasil</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Criar Conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Encurtador de Links Gratuito
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Encurte URLs longas instantaneamente e acompanhe os cliques
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Sem cadastro necessário • Até 5 links por dia
          </p>
        </div>

        {/* Success Card */}
        {success && (
          <div className="mb-8 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-4">
                Link criado com sucesso!
              </h3>
              <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-700">
                <code className="text-lg font-mono text-purple-600 break-all">
                  {success.shortUrl}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(success.shortUrl)}
                className="w-full sm:w-auto px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
              >
                📋 Copiar Link
              </button>
              <p className="mt-4 text-sm text-green-700 dark:text-green-400">
                Slug: <code className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">{success.slug}</code>
              </p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
              <span dangerouslySetInnerHTML={{ __html: error }} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Cole sua URL longa aqui
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                placeholder="https://exemplo.com/link-muito-longo-que-quero-compartilhar"
                className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-base transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Slug personalizado (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-base font-medium">
                  {window.location.origin}/s/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="meu-link-legal"
                  pattern="[a-zA-Z0-9_-]+"
                  className="w-full pl-56 pr-5 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-base font-mono transition"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Deixe em branco para gerar automaticamente. Apenas letras, números, hífens e underscores.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition font-semibold text-lg shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Encurtar Link
                </>
              )}
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Super Rápido</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Encurtamento instantâneo, sem espera
            </p>
          </div>

          <div className="text-center p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Acompanhe cliques, países e dispositivos
            </p>
          </div>

          <div className="text-center p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Seguro</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Seus dados são protegidos
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">
              Criou conta e quer mais? 💎
            </h3>
            <p className="mb-6 text-purple-100">
              Com uma conta grátis, você pode criar links ilimitados, ter seu próprio dashboard personalizado, e muito mais!
            </p>
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition font-semibold text-lg shadow-lg"
            >
              Criar Conta Gratuita
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2026 LinkBio Brasil. Todos os direitos reservados.</p>
          <p className="mt-2">
            <Link href="/auth/signup" className="text-purple-600 hover:underline">
              Criar conta
            </Link>
            {' • '}
            <Link href="/" className="text-purple-600 hover:underline">
              Voltar ao inicio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
