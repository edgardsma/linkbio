'use client'

function extractKwaiVideoId(url) {
  const match = url.match(/video\/(\d+)/) || url.match(/\/p\/(\w+)/)
  return match ? match[1] : null
}

export default function KwaiEmbed({ url, title }) {
  const videoId = extractKwaiVideoId(url)

  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 w-full rounded-xl p-4 bg-orange-500 text-white font-semibold hover:bg-orange-600 transition shadow-lg"
      >
        <span className="text-2xl">📹</span>
        <span>{title || 'Ver vídeo no Kwai'}</span>
      </a>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-full bg-black">
      <div className="relative w-full" style={{ paddingBottom: '177.78%', maxHeight: '500px' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.kwai.com/p/${videoId}?embed=1`}
          title={title || 'Kwai video'}
          allowFullScreen
          loading="lazy"
          style={{ maxHeight: '500px' }}
        />
      </div>
      {title && (
        <div className="px-4 py-2 bg-orange-600 text-sm font-medium text-white">
          📹 {title}
        </div>
      )}
    </div>
  )
}
