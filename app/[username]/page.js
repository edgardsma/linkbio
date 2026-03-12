import { prisma } from '@/lib/prisma.js'
import { getCached, setCached } from '@/lib/redis'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import LinkRenderer from '@/components/LinkRenderer'

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
              style={{ color: themeColors.text, opacity: 0.6 }}
            >
              <p>Este usuário ainda não adicionou links</p>
            </div>
          ) : (
            user.links.map((link) => (
              <LinkRenderer
                key={link.id}
                link={link}
                themeColors={themeColors}
              />
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
