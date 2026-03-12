'use client'

function extractYouTubeId(url) {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?#]+)/,
    /youtube\.com\/embed\/([^?#]+)/,
    /youtube\.com\/shorts\/([^?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function YouTubeEmbed({ url, title }) {
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl p-4 bg-red-600 text-white text-center font-semibold hover:bg-red-700 transition"
      >
        ▶ {title || 'Assistir no YouTube'}
      </a>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-full bg-black">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {title && (
        <div className="px-4 py-2 bg-white dark:bg-gray-900 text-sm font-medium text-gray-800 dark:text-gray-100">
          ▶ {title}
        </div>
      )}
    </div>
  )
}
