'use client'

import YouTubeEmbed from './YouTubeEmbed'
import SpotifyEmbed from './SpotifyEmbed'
import TikTokEmbed from './TikTokEmbed'
import ThreadsEmbed from './ThreadsEmbed'
import SoundCloudEmbed from './SoundCloudEmbed'
import TwitchEmbed from './TwitchEmbed'
import KwaiEmbed from './KwaiEmbed'
import PodcastEmbed from './PodcastEmbed'
import LeadForm from './LeadForm'
import HotmartCard from './HotmartCard'
import KiwifyCard from './KiwifyCard'
import InfoprodutoCard from './InfoprodutoCard'
import BookingWidget from './BookingWidget'

export default function LinkRenderer({ link, themeColors }) {
  const gradient = `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`

  switch (link.type) {
    case 'youtube':
      return <YouTubeEmbed url={link.url} title={link.title} />

    case 'spotify':
      return <SpotifyEmbed url={link.url} title={link.title} />

    case 'tiktok':
      return <TikTokEmbed url={link.url} title={link.title} />

    case 'threads':
      return <ThreadsEmbed url={link.url} title={link.title} />

    case 'soundcloud':
      return <SoundCloudEmbed url={link.url} title={link.title} />

    case 'twitch':
      return <TwitchEmbed url={link.url} title={link.title} />

    case 'kwai':
      return <KwaiEmbed url={link.url} title={link.title} />

    case 'podcast':
      return <PodcastEmbed url={link.url} title={link.title} description={link.description} />

    case 'leadform':
      return <LeadForm link={link} themeColors={themeColors} />

    case 'booking':
      return <BookingWidget link={link} themeColors={themeColors} />

    case 'hotmart':
      return <HotmartCard link={link} themeColors={themeColors} />

    case 'kiwify':
      return <KiwifyCard link={link} themeColors={themeColors} />

    case 'eduzz':
    case 'monetizze':
      return <InfoprodutoCard link={link} themeColors={themeColors} />

    default:
      // Standard link button (url, email, phone, whatsapp, whatsapp_business)
      return (
        <a
          href={`/api/links/${link.id}/click?url=${encodeURIComponent(link.url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] p-4"
          style={{ background: gradient }}
        >
          <div className="flex items-center gap-4">
            {link.icon && (
              <span className="text-2xl flex-shrink-0">{link.icon}</span>
            )}
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-lg text-white">
                {link.title}
              </h3>
              {link.description && (
                <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {link.description}
                </p>
              )}
            </div>
            <svg
              className="w-5 h-5 flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      )
  }
}
