'use client'

import { useEffect, useState } from 'react'

function parseTwitchUrl(url) {
  const videoMatch = url.match(/twitch\.tv\/videos\/(\d+)/)
  if (videoMatch) return { type: 'video', id: videoMatch[1] }

  const clipMatch = url.match(/twitch\.tv\/[^/]+\/clip\/([^?#]+)/)
  if (clipMatch) return { type: 'clip', id: clipMatch[1] }

  const channelMatch = url.match(/twitch\.tv\/([^/?#]+)/)
  if (channelMatch && channelMatch[1] !== 'videos') {
    return { type: 'channel', id: channelMatch[1] }
  }

  return null
}

export default function TwitchEmbed({ url, title }) {
  const [hostname, setHostname] = useState('localhost')

  useEffect(() => {
    setHostname(window.location.hostname || 'localhost')
  }, [])

  const twitch = parseTwitchUrl(url)

  if (!twitch) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl p-4 bg-purple-600 text-white text-center font-semibold hover:bg-purple-700 transition"
      >
        🎮 {title || 'Assistir na Twitch'}
      </a>
    )
  }

  let embedSrc = ''
  if (twitch.type === 'video') {
    embedSrc = `https://player.twitch.tv/?video=${twitch.id}&parent=${hostname}&autoplay=false`
  } else if (twitch.type === 'clip') {
    embedSrc = `https://clips.twitch.tv/embed?clip=${twitch.id}&parent=${hostname}`
  } else {
    embedSrc = `https://player.twitch.tv/?channel=${twitch.id}&parent=${hostname}&autoplay=false`
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-full bg-black">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={embedSrc}
          title={title || 'Twitch'}
          allowFullScreen
        />
      </div>
      {title && (
        <div className="px-4 py-2 bg-purple-900 text-sm font-medium text-white">
          🎮 {title}
        </div>
      )}
    </div>
  )
}
