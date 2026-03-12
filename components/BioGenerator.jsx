'use client'

import { useState } from 'react'

export default function BioGenerator({ onSelect }) {
  const [form, setForm] = useState({ name: '', niche: '', keywords: '', style: 'casual' })
  const [loading, setLoading] = useState(false)
  const [bios, setBios] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)

  async function generate() {
    if (!form.niche) { setError('Informe seu nicho'); return }
    setLoading(true)
    setError('')
    setBios([])

    try {
      const res = await fetch('/api/ai/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBios(data.bios || [])
    } catch (e) {
      setError(e.message || 'Erro ao gerar bio')
    } finally {
      setLoading(false)
    }
  }

  function copy(bio, i) {
    navigator.clipboard.writeText(bio)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">✨</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerador de Bio com IA</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gera 3 opções otimizadas para seu perfil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <input
          placeholder="Seu nome (opcional)"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          placeholder="Seu nicho * (ex: nutrição, finanças, moda)"
          value={form.niche}
          onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          placeholder="Palavras-chave (ex: receitas saudáveis, emagrecimento)"
          value={form.keywords}
          onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:col-span-2"
        />
        <select
          value={form.style}
          onChange={e => setForm(f => ({ ...f, style: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="casual">Casual e descontraído</option>
          <option value="professional">Profissional e formal</option>
          <option value="fun">Divertido com emojis</option>
          <option value="inspiring">Inspirador e motivacional</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 mb-6"
      >
        {loading ? '✨ Gerando...' : '✨ Gerar Bio com IA'}
      </button>

      {bios.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Escolha uma opção:</p>
          {bios.map((bio, i) => (
            <div key={i} className="relative group border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-purple-400 transition">
              <p className="text-gray-800 dark:text-gray-200 text-sm pr-16">{bio}</p>
              <span className="absolute top-3 right-12 text-xs text-gray-400">{bio.length}/150</span>
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => copy(bio, i)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs"
                  title="Copiar"
                >
                  {copied === i ? '✅' : '📋'}
                </button>
                {onSelect && (
                  <button
                    onClick={() => onSelect(bio)}
                    className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs"
                    title="Usar esta bio"
                  >
                    Usar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
