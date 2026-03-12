'use client'

function getSpotifyEmbedUrl(url) {
  // https://open.spotify.com/track/ID?si=xxx → https://open.spotify.com/embed/track/ID
  const match = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([a-zA-Z0-9]+)/)
  if (!match) return null
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`
}

export default function SpotifyEmbed({ url, title }) {
  const embedUrl = getSpotifyEmbedUrl(url)

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl p-4 bg-green-500 text-white text-center font-semibold hover:bg-green-600 transition"
      >
        🎵 {title || 'Ouvir no Spotify'}
      </a>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-full">
      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ borderRadius: '12px' }}
      />
    </div>
  )
}
