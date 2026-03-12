const LINK_TYPE_GROUPS = [
  {
    label: 'Links Padrão',
    types: [
      { value: 'url', label: 'Link Genérico', icon: '🔗', placeholder: 'https://meusite.com' },
      { value: 'whatsapp', label: 'WhatsApp', icon: '💬', placeholder: '5511999998888' },
      { value: 'whatsapp_business', label: 'WhatsApp + Mensagem', icon: '💼', placeholder: '5511999998888' },
      { value: 'email', label: 'E-mail', icon: '📧', placeholder: 'email@exemplo.com' },
      { value: 'phone', label: 'Telefone', icon: '📞', placeholder: '5511999998888' },
    ],
  },
  {
    label: '🎥 Embeds de Vídeo e Música',
    types: [
      { value: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/watch?v=...' },
      { value: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'https://www.tiktok.com/@user/video/...' },
      { value: 'twitch', label: 'Twitch', icon: '🎮', placeholder: 'https://www.twitch.tv/canal' },
      { value: 'spotify', label: 'Spotify', icon: '🎧', placeholder: 'https://open.spotify.com/track/...' },
      { value: 'soundcloud', label: 'SoundCloud', icon: '🎶', placeholder: 'https://soundcloud.com/artista/musica' },
    ],
  },
  {
    label: '💬 Redes Sociais',
    types: [
      { value: 'threads', label: 'Threads', icon: '🧵', placeholder: 'https://www.threads.net/@user/post/...' },
      { value: 'kwai', label: 'Kwai', icon: '📹', placeholder: 'https://www.kwai.com/video/...' },
    ],
  },
  {
    label: '🇧🇷 Infoprodutos',
    types: [
      { value: 'hotmart', label: 'Hotmart', icon: '🔥', placeholder: 'https://go.hotmart.com/...' },
      { value: 'kiwify', label: 'Kiwify', icon: '🥝', placeholder: 'https://go.kiwify.com.br/...' },
      { value: 'eduzz', label: 'Eduzz', icon: '📘', placeholder: 'https://sun.eduzz.com/...' },
      { value: 'monetizze', label: 'Monetizze', icon: '💚', placeholder: 'https://monetizze.com.br/...' },
    ],
  },
  {
    label: '📧 Captura de Leads',
    types: [
      { value: 'leadform', label: 'Formulário de Leads', icon: '✉️', placeholder: '' },
      { value: 'booking', label: 'Agendamento', icon: '📅', placeholder: '@seuusername' },
      { value: 'podcast', label: 'Podcast (RSS)', icon: '🎙️', placeholder: 'https://feed.podcast.com/rss' },
    ],
  },
]

export const ALL_LINK_TYPES = LINK_TYPE_GROUPS.flatMap(g => g.types)

export default function LinkTypeSelector({ value, onChange }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tipo de Link
      </label>
      {LINK_TYPE_GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {group.types.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => onChange(type.value)}
                className={`p-3 border-2 rounded-xl transition-all flex items-center gap-2 text-left ${
                  value === type.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/40'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <span className="text-xl">{type.icon}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function getLinkPlaceholder(linkType) {
  const found = ALL_LINK_TYPES.find(t => t.value === linkType)
  return found?.placeholder || 'https://meusite.com'
}

export function formatLinkUrl(linkType, value, options = {}) {
  switch (linkType) {
    case 'whatsapp': {
      const phone = value.replace(/\D/g, '')
      return `https://wa.me/55${phone}`
    }
    case 'whatsapp_business': {
      const phone = value.replace(/\D/g, '')
      const msg = options.message ? `?text=${encodeURIComponent(options.message)}` : ''
      return `https://wa.me/55${phone}${msg}`
    }
    case 'email':
      return `mailto:${value}`
    case 'phone': {
      const phoneNumber = value.replace(/\D/g, '')
      return `tel:+55${phoneNumber}`
    }
    default:
      return value
  }
}

export function getLinkTypeInfo(type) {
  return ALL_LINK_TYPES.find(t => t.value === type) || ALL_LINK_TYPES[0]
}
