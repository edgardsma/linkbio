'use client'

import { useState } from 'react'

const LEVEL_COLORS = {
  baixo: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  medio: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  alto: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const LEVEL_LABELS = { baixo: '🟢 Baixa', medio: '🟡 Média', alto: '🔴 Alta' }

export default function HashtagGenerator() {
  const [form, setForm] = useState({ niche: '', topic: '', platform: 'Instagram' })
  const [loading, setLoading] = useState(false)
  const [hashtags, setHashtags] = useState([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!form.niche) { setError('Informe seu nicho'); return }
    setLoading(true)
    setError('')
    setHashtags([])
    setSelected(new Set())

    try {
      const res = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHashtags(data.hashtags || [])
    } catch (e) {
      setError(e.message || 'Erro ao gerar hashtags')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(tag) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  function copySelected() {
    const tags = selected.size > 0
      ? [...selected].join(' ')
      : hashtags.map(h => h.tag).join(' ')
    navigator.clipboard.writeText(tags)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const byLevel = {
    baixo: hashtags.filter(h => h.level === 'baixo'),
    medio: hashtags.filter(h => h.level === 'medio'),
    alto: hashtags.filter(h => h.level === 'alto'),
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">#️⃣</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerador de Hashtags</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">30 hashtags estratégicas com nível de concorrência</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <input
          placeholder="Nicho * (ex: moda feminina)"
          value={form.niche}
          onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          placeholder="Assunto específico (opcional)"
          value={form.topic}
          onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select
          value={form.platform}
          onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option>Instagram</option>
          <option>TikTok</option>
          <option>LinkedIn</option>
          <option>Twitter</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 mb-6"
      >
        {loading ? '⏳ Gerando...' : '#️⃣ Gerar Hashtags'}
      </button>

      {hashtags.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selected.size > 0 ? `${selected.size} selecionadas` : 'Clique para selecionar'}
            </p>
            <button
              onClick={copySelected}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
            >
              {copied ? '✅ Copiado!' : `📋 Copiar ${selected.size > 0 ? `(${selected.size})` : 'todas'}`}
            </button>
          </div>

          {Object.entries(byLevel).map(([level, tags]) => tags.length > 0 && (
            <div key={level} className="mb-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                Concorrência {LEVEL_LABELS[level]}
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => toggleSelect(h.tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition border-2 ${
                      selected.has(h.tag)
                        ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        : `${LEVEL_COLORS[level]} border-transparent`
                    }`}
                    title={h.estimated_reach ? `~${h.estimated_reach} posts` : ''}
                  >
                    {h.tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
