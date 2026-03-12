'use client'

import { useState } from 'react'

const PRESETS = {
  instagram_bio: { source: 'instagram', medium: 'social', campaign: 'bio' },
  tiktok_bio: { source: 'tiktok', medium: 'social', campaign: 'bio' },
  whatsapp: { source: 'whatsapp', medium: 'messaging', campaign: 'bio' },
  email: { source: 'email', medium: 'email', campaign: 'newsletter' },
  youtube: { source: 'youtube', medium: 'video', campaign: 'bio' },
  google_ads: { source: 'google', medium: 'cpc', campaign: '' },
}

export default function UTMBuilder() {
  const [url, setUrl] = useState('')
  const [params, setParams] = useState({ source: '', medium: '', campaign: '', term: '', content: '' })
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  function applyPreset(key) {
    setParams(p => ({ ...p, ...PRESETS[key] }))
  }

  function build() {
    if (!url) return
    try {
      const base = new URL(url.startsWith('http') ? url : `https://${url}`)
      if (params.source) base.searchParams.set('utm_source', params.source)
      if (params.medium) base.searchParams.set('utm_medium', params.medium)
      if (params.campaign) base.searchParams.set('utm_campaign', params.campaign)
      if (params.term) base.searchParams.set('utm_term', params.term)
      if (params.content) base.searchParams.set('utm_content', params.content)
      setResult(base.toString())
    } catch {
      setResult('URL inválida')
    }
  }

  function copy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔗</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">UTM Builder</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gere URLs com parâmetros de rastreamento</p>
        </div>
      </div>

      {/* URL base */}
      <input
        type="url"
        placeholder="URL de destino (ex: https://seusite.com/produto)"
        value={url}
        onChange={e => setUrl(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
      />

      {/* Presets */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Presets rápidos</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([key, _]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-purple-300 transition"
            >
              {key.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Params */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {[
          { key: 'source', label: 'utm_source *', placeholder: 'instagram, google...' },
          { key: 'medium', label: 'utm_medium *', placeholder: 'social, cpc, email...' },
          { key: 'campaign', label: 'utm_campaign *', placeholder: 'nome-da-campanha' },
          { key: 'term', label: 'utm_term', placeholder: 'palavra-chave (pago)' },
          { key: 'content', label: 'utm_content', placeholder: 'variação do anúncio' },
        ].map(field => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{field.label}</label>
            <input
              placeholder={field.placeholder}
              value={params[field.key]}
              onChange={e => setParams(p => ({ ...p, [field.key]: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        ))}
      </div>

      <button
        onClick={build}
        disabled={!url || !params.source}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 mb-4"
      >
        🔗 Gerar URL com UTM
      </button>

      {result && result !== 'URL inválida' && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 flex-grow break-all font-mono">{result}</p>
            <button
              onClick={copy}
              className="flex-shrink-0 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition"
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
        </div>
      )}
      {result === 'URL inválida' && (
        <p className="text-red-500 text-sm">URL inválida. Inclua https://</p>
      )}
    </div>
  )
}
