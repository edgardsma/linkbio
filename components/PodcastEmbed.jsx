'use client'

import { useState, useEffect } from 'react'

function formatDuration(seconds) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PodcastEmbed({ url, title, description }) {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playing, setPlaying] = useState(null)

  useEffect(() => {
    fetch(`/api/integrations/podcast?url=${encodeURIComponent(url)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setEpisodes(data.episodes || []))
      .catch(() => setError('Não foi possível carregar o podcast'))
      .finally(() => setLoading(false))
  }, [url])

  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎙️</span>
          <div>
            <h3 className="font-bold text-lg leading-tight">{title || 'Podcast'}</h3>
            {description && (
              <p className="text-sm text-white/80 line-clamp-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {loading && (
          <div className="p-6 text-center text-gray-400">Carregando episódios...</div>
        )}
        {error && (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{error}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 text-sm hover:underline"
            >
              Abrir feed do podcast →
            </a>
          </div>
        )}
        {episodes.slice(0, 5).map((ep, i) => (
          <div key={i} className="p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setPlaying(playing === i ? null : i)}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition"
              >
                {playing === i ? '⏸' : '▶'}
              </button>
              <div className="flex-grow min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                  {ep.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {ep.pubDate && new Date(ep.pubDate).toLocaleDateString('pt-BR')}
                  {ep.duration && ` · ${formatDuration(ep.duration)}`}
                </p>
              </div>
            </div>
            {playing === i && ep.audioUrl && (
              <audio
                src={ep.audioUrl}
                controls
                autoPlay
                className="w-full mt-3 rounded-lg"
              />
            )}
          </div>
        ))}
      </div>

      {episodes.length > 0 && (
        <div className="p-3 text-center border-t border-gray-100 dark:border-gray-800">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 text-sm hover:underline"
          >
            Ver todos os episódios →
          </a>
        </div>
      )}
    </div>
  )
}
