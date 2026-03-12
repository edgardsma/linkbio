'use client'

import { useEffect, useRef } from 'react'

function extractTikTokVideoId(url) {
  const match = url.match(/video\/(\d+)/)
  return match ? match[1] : null
}

export default function TikTokEmbed({ url, title }) {
  const containerRef = useRef(null)
  const videoId = extractTikTokVideoId(url)

  useEffect(() => {
    if (!videoId) return

    // Inject TikTok embed script if not already present
    const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.tiktok.com/embed.js'
      script.async = true
      document.body.appendChild(script)
    } else if (window.tiktokEmbed) {
      window.tiktokEmbed.lib.render(containerRef.current)
    }
  }, [videoId, url])

  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl p-4 bg-black text-white text-center font-semibold hover:bg-gray-900 transition"
      >
        🎵 {title || 'Ver no TikTok'}
      </a>
    )
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center rounded-xl overflow-hidden shadow-lg">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: '325px', minWidth: '325px' }}
      >
        <section>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={url}
            className="text-gray-500 text-sm"
          >
            {title || 'Ver vídeo no TikTok'}
          </a>
        </section>
      </blockquote>
    </div>
  )
}
