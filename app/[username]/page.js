import { prisma } from '@/lib/prisma.js'
import { notFound } from 'next/navigation'
import { getUserProfile, invalidateProfile } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'

export default async function ProfilePage({ params }) {
  const requestId = getRequestId()
  const { username } = await params
  const usernameClean = username.replace('@', '')

  // Usar cache do Redis para perfis públicos
  const user = await getUserProfile(usernameClean)

  if (!user) {
    logger.warn('Perfil não encontrado', { requestId, username: usernameClean })
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
            <img
              src={user.image}
              alt={user.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg"
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
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(link.id)}
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

// Função para registrar cliques
async function trackClick(linkId) {
  try {
    // Incrementar contador de cliques
    await prisma.link.update({
      where: { id: linkId },
      data: {
        clicks: {
          increment: 1,
        },
      },
    })

    // Registrar log do clique
    await prisma.click.create({
      data: {
        linkId,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      },
    })
  } catch (error) {
    console.error('Erro ao registrar clique:', error)
  }
}

// Configuração de SEO dinâmico
export async function generateMetadata({ params }) {
  const { username } = await params
  const usernameClean = username.replace('@', '')

  // Usar cache para metadata também
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
