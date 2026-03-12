'use client'

function getSoundCloudEmbedUrl(url) {
  const params = new URLSearchParams({
    url,
    color: '%23ff5500',
    auto_play: 'false',
    hide_related: 'false',
    show_comments: 'true',
    show_user: 'true',
    show_reposts: 'false',
    show_teaser: 'true',
    visual: 'true',
  })
  return `https://w.soundcloud.com/player/?${params.toString()}`
}

export default function SoundCloudEmbed({ url, title }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-full">
      <iframe
        width="100%"
        height="300"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={getSoundCloudEmbedUrl(url)}
        style={{ borderRadius: '12px' }}
        title={title || 'SoundCloud player'}
      />
    </div>
  )
}
