'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function KiwifyCard({ link, themeColors }) {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (link.icon && link.icon.startsWith('http')) {
      setMeta({ image: link.icon, price: null })
      setLoading(false)
      return
    }

    fetch(`/api/integrations/metadata?url=${encodeURIComponent(link.url)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setMeta(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [link.url, link.icon])

  return (
    <a
      href={`/api/links/${link.id}/click?url=${encodeURIComponent(link.url)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
    >
      {meta?.image && (
        <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800">
          <Image
            src={meta.image}
            alt={link.title}
            fill
            className="object-cover"
            unoptimized
          />
          <div
            className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full text-white"
            style={{ background: '#7c3aed' }}
          >
            Kiwify
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {link.icon && !link.icon.startsWith('http') && (
            <span className="text-2xl flex-shrink-0">{link.icon}</span>
          )}
          <div className="flex-grow min-w-0">
            <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
              {link.title}
            </h3>
            {link.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {link.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          {meta?.price && (
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              R$ {meta.price}
            </span>
          )}
          <span
            className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
            }}
          >
            Quero este produto →
          </span>
        </div>
      </div>
    </a>
  )
}
