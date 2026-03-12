'use client'

import { useState } from 'react'

const PLATFORMS = ['instagram', 'tiktok', 'linkedin']
const PLATFORM_ICONS = { instagram: '📸', tiktok: '🎵', linkedin: '💼' }
const PLATFORM_LABELS = { instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn' }

export default function CaptionGenerator() {
  const [form, setForm] = useState({
    description: '',
    platforms: ['instagram'],
    niche: '',
    tone: 'informal',
  })
  const [loading, setLoading] = useState(false)
  const [captions, setCaptions] = useState({})
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)
  const [activeTab, setActiveTab] = useState('instagram')

  function togglePlatform(p) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }))
  }

  async function generate() {
    if (!form.description) { setError('Descreva o post'); return }
    if (form.platforms.length === 0) { setError('Selecione pelo menos uma plataforma'); return }
    setLoading(true)
    setError('')
    setCaptions({})

    try {
      const res = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCaptions(data.captions || {})
      const firstPlatform = form.platforms[0]
      if (firstPlatform) setActiveTab(firstPlatform)
    } catch (e) {
      setError(e.message || 'Erro ao gerar legenda')
    } finally {
      setLoading(false)
    }
  }

  function copy(platform) {
    navigator.clipboard.writeText(captions[platform] || '')
    setCopied(platform)
    setTimeout(() => setCopied(null), 2000)
  }

  const hasCaptions = Object.keys(captions).length > 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">✍️</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerador de Legendas</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Legendas otimizadas para cada rede social</p>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <textarea
          placeholder="Descreva o que é o post (ex: receita de bolo de cenoura saudável, sem glúten)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <input
              placeholder="Seu nicho (opcional)"
              value={form.niche}
              onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={form.tone}
            onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}
            className="flex-1 min-w-[140px] border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="informal">Tom informal</option>
            <option value="professional">Profissional</option>
            <option value="funny">Engraçado</option>
            <option value="educational">Educativo</option>
            <option value="sales">Vendas</option>
          </select>
        </div>

        <div className="flex gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${
                form.platforms.includes(p)
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {PLATFORM_ICONS[p]} {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 mb-6"
      >
        {loading ? '✍️ Gerando...' : '✍️ Gerar Legendas'}
      </button>

      {hasCaptions && (
        <div>
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            {form.platforms.filter(p => captions[p]).map(p => (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
                  activeTab === p
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {PLATFORM_ICONS[p]} {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>

          {captions[activeTab] && (
            <div className="relative">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 font-sans leading-relaxed max-h-80 overflow-y-auto">
                {captions[activeTab]}
              </pre>
              <button
                onClick={() => copy(activeTab)}
                className="absolute top-3 right-3 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition"
              >
                {copied === activeTab ? '✅' : '📋 Copiar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
