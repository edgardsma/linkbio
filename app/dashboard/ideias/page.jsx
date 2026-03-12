'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

const TYPE_COLORS = {
  'Carrossel': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Reels': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Stories': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Post estático': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Live': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

export default function IdeiasPage() {
  const { data: session } = useSession()
  const [form, setForm] = useState({ niche: '', platforms: ['Instagram', 'TikTok'], goal: 'followers' })
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState([])
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  const allPlatforms = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn']

  function togglePlatform(p) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }))
  }

  async function generate() {
    if (!form.niche) { setError('Informe seu nicho'); return }
    setLoading(true)
    setError('')
    setIdeas([])

    try {
      const res = await fetch('/api/ai/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIdeas(data.ideas || [])
    } catch (e) {
      setError(e.message || 'Erro ao gerar ideias')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💡 Ideias de Conteúdo</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            IA gera 7 ideias de posts para a semana inteira
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Seu nicho * (ex: fitness, finanças pessoais, receitas)"
              value={form.niche}
              onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={form.goal}
              onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="followers">🚀 Crescimento de seguidores</option>
              <option value="sales">💰 Vendas de produtos</option>
              <option value="authority">🎓 Autoridade no nicho</option>
              <option value="engagement">💬 Engajamento e comunidade</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {allPlatforms.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${
                  form.platforms.includes(p)
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? '🧠 Gerando ideias...' : '💡 Gerar Calendário de Conteúdo'}
          </button>
        </div>

        {/* Ideas */}
        {ideas.length > 0 && (
          <div className="space-y-3">
            {ideas.map((idea, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-center w-16 flex-shrink-0">
                      <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">{idea.day}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[idea.type] || 'bg-gray-100 text-gray-600'}`}>
                          {idea.type}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{idea.title}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 flex-shrink-0 ml-4">
                    {expanded === i ? '▲' : '▼'}
                  </span>
                </button>

                {expanded === i && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {idea.hook && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">🎣 Hook (primeira frase)</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{idea.hook}"</p>
                      </div>
                    )}
                    {idea.outline && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">📋 Roteiro</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{idea.outline}</p>
                      </div>
                    )}
                    {idea.cta && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">🎯 Call-to-Action</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{idea.cta}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
