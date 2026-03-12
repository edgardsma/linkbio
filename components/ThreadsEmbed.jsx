'use client'

import { useEffect, useRef } from 'react'

export default function ThreadsEmbed({ url, title }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://www.threads.net/embed/button-plugin.js"]'
    )
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.threads.net/embed/button-plugin.js'
      script.async = true
      document.body.appendChild(script)
    } else if (window.instgrm) {
      window.instgrm.Embeds.process()
    }
  }, [url])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900 p-4"
    >
      <blockquote
        className="text-post-media"
        data-url={url}
        data-width="550"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 dark:text-gray-300 text-sm hover:underline"
        >
          🧵 {title || 'Ver post no Threads'}
        </a>
      </blockquote>
    </div>
  )
}
