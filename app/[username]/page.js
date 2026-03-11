import { prisma } from '@/lib/prisma.js'
import { getCached, setCached } from '@/lib/redis'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

async function getUserProfile(username) {
  const cacheKey = `profile:${username}`
  const cached = await getCached({ key: cacheKey, ttl: 300 })
  if (cached) return cached

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
      },
    })
    if (user) {
      await setCached({ key: cacheKey, ttl: 300 }, user)
    }
    return user
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
}

export default async function ProfilePage({ params }) {
  const { username } = await params
  const usernameClean = username.replace('@', '')

  const user = await getUserProfile(usernameClean)

  if (!user) {
    notFound()
  }

  // Cores do tema ou cores padrão
  const themeColors = {
    primary: user.primaryColor || '#667eea',
    secondary: user.secondaryColor || '#764ba2',
    background: user.backgroundColor || '#f9fafb',
    text: user.textColor || '#111827',
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: themeColors.background,
      }}
    >
      {/* Background Personalizado */}
      {user.background && (
        <div
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: `url(${user.background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      )}

      {/* Overlay com gradiente baseado nas cores do tema */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `linear-gradient(135deg, ${themeColors.primary}10 0%, ${themeColors.secondary}10 100%)`,
          pointerEvents: 'none',
        }}
      ></div>

      <div className="container mx-auto px-4 py-12 max-w-md relative z-10">
        {/* Profile Header */}
        <div className="text-center mb-8">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name || user.username}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg object-cover"
              style={{
                border: `4px solid ${themeColors.primary}`,
              }}
            />
          )}
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              color: themeColors.text,
            }}
          >
            {user.name || user.username}
          </h1>
          {user.bio && (
            <p
              className="opacity-80"
              style={{
                color: themeColors.text,
              }}
            >
              {user.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {user.links.length === 0 ? (
            <div
              className="text-center py-8"
              style={{
                color: themeColors.text,
                opacity: 0.6,
              }}
            >
              <p>Este usuário ainda não adicionou links</p>
            </div>
          ) : (
            user.links.map((link) => (
              <a
                key={link.id}
                href={`/api/links/${link.id}/click?url=${encodeURIComponent(link.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-4"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
                }}
              >
                <div className="flex items-center gap-4">
                  {link.icon && (
                    <span className="text-2xl flex-shrink-0">{link.icon}</span>
                  )}
                  <div className="flex-grow min-w-0">
                    <h3
                      className="font-semibold text-lg"
                      style={{
                        color: '#ffffff',
                      }}
                    >
                      {link.title}
                    </h3>
                    {link.description && (
                      <p
                        className="text-sm truncate"
                        style={{
                          color: 'rgba(255, 255, 255, 0.85)',
                        }}
                      >
                        {link.description}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="text-sm hover:underline"
            style={{
              color: themeColors.primary,
            }}
          >
            Crie sua página no LinkBio Brasil
          </a>
        </div>
      </div>
    </div>
  )
}

// Configuração de SEO dinâmico
export async function generateMetadata({ params }) {
  const { username } = await params
  const usernameClean = username.replace('@', '')

  const user = await getUserProfile(usernameClean)

  if (!user) {
    return {
      title: 'Perfil não encontrado',
    }
  }

  return {
    title: `${user.name || user.username} - LinkBio Brasil`,
    description: user.bio || `Confira os links de ${user.name || user.username}`,
    openGraph: {
      title: `${user.name || user.username} - LinkBio Brasil`,
      description: user.bio || `Confira os links de ${user.name || user.username}`,
      images: user.image ? [user.image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.name || user.username} - LinkBio Brasil`,
      description: user.bio || `Confira os links de ${user.name || user.username}`,
      images: user.image ? [user.image] : [],
    },
  }
}
