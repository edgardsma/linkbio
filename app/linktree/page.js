/**
 * Página LinkTree - Clone Simplificado do Linktree
 * Versão minimalista com todas as funcionalidades principais
 */

import { prisma } from '@/lib/prisma.js'

// Função para registrar cliques em background
async function trackClick(linkId) {
  try {
    await prisma.link.update({
      where: { id: linkId },
      data: {
        clicks: {
          increment: 1,
        },
      },
    })
  } catch (error) {
    console.error('Erro ao registrar clique:', error)
  }
}

export const dynamic = 'force-dynamic'

export default async function LinktreePage({ params }) {
  const { username } = await params
  const usernameClean = username.replace('@', '').toLowerCase()

  const user = await prisma.user.findUnique({
    where: { username: usernameClean },
    include: {
      links: {
        where: { isActive: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">
            @{usernameClean}
          </h1>
          <p className="text-gray-500">Usuário não encontrado</p>
          <a href="/" className="text-purple-600 hover:underline">
            Voltar para a página inicial
          </a>
        </div>
      </div>
    )
  }

  // Cores do tema ou cores personalizadas
  const colors = {
    primary: user.primaryColor || '#667eea',
    secondary: user.secondaryColor || '#764ba2',
    background: user.backgroundColor || '#f9fafb',
    text: user.textColor || '#111827',
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.background,
      backgroundImage: user.background ? `url(${user.background})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background personalizado com overlay */}
      <div
        className="fixed inset-0 bg-black/40"
        style={{
          backgroundImage: user.background ? 'none' : `linear-gradient(135deg, ${colors.primary}22 0%, ${colors.secondary}22 100%)`,
        }}
      />

      {/* Container principal */}
      <div className="container mx-auto px-4 py-8 max-w-md relative z-10">
        {/* Header com avatar */}
        <div className="text-center mb-6">
          {user.image && (
            <img
              src={user.image}
              alt={user.name}
              className="w-24 h-24 rounded-full mx-auto border-4"
              style={{ borderColor: colors.primary }}
            />
          )}
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            {user.name || user.username}
          </h1>
          {user.bio && (
            <p className="opacity-80 mb-6" style={{ color: colors.text }}>
              {user.bio}
            </p>
          )}
          <a
            href="/"
            className="inline-block px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: colors.primary,
              color: 'white',
              borderRadius: '8px',
            }}
          >
            Criar sua página gratuita
          </a>
        </div>

        {/* Links - Estilo Linktree */}
        <div className="space-y-3">
          {user.links.length === 0 ? (
            <div className="text-center py-12" style={{ color: colors.text }}>
              <p className="text-lg mb-2">Nenhum link adicionado ainda</p>
              <p className="text-sm opacity-60">
                @{usernameClean} ainda não tem links
              </p>
            </div>
          ) : (
            user.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(link.id)}
                className="block p-4 rounded-xl transition-all duration-200 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  color: 'white',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Ícone */}
                  {link.icon && (
                    <span className="text-2xl">{link.icon}</span>
                  )}

                  <div className="flex-grow">
                    <h3
                      className="font-semibold text-lg truncate"
                      style={{ color: 'white' }}
                    >
                      {link.title}
                    </h3>
                    {link.description && (
                      <p
                        className="text-sm opacity-90 truncate"
                        style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                      >
                        {link.description}
                      </p>
                    )}
                  </div>

                  {/* Setinha com contador de cliques */}
                  {link.clicks > 0 && (
                    <div
                      className="text-xs font-medium opacity-75"
                      style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {link.clicks} clique{link.clicks !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Seta de acesso */}
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6l9 12h20"
                  />
                </svg>
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8" style={{ color: colors.text }}>
          <p className="text-sm opacity-60 mb-2">
            Powered by{' '}
            <a href="/" className="font-medium hover:underline" style={{ color: colors.primary }}>
              LinkBio Brasil
            </a>
          </p>
          <a
            href="/"
            className="inline-block text-sm hover:underline"
            style={{ color: colors.primary }}
          >
            Crie sua página gratuita
          </a>
        </div>
      </div>

      {/* Header do site */}
      <nav className="fixed top-0 left-0 right-0 z-20 p-4">
        <a
          href="/"
          className="text-2xl font-bold hover:scale-110 transition-transform"
          style={{ color: 'white' }}
        >
          LinkBio Brasil
        </a>
      </nav>
    </div>
  )
}

// Configuração de SEO dinâmica
export async function generateMetadata({ params }) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username: username.replace('@', '').toLowerCase() },
  })

  if (!user) {
    return {
      title: 'Usuário não encontrado',
      description: 'Página do usuário não existe',
    }
  }

  return {
    title: `${user.name || user.username} - LinkBio Brasil`,
    description: user.bio || `Confira os links de ${user.name || user.username}`,
    openGraph: {
      title: `${user.name || user.username} - LinkBio Brasil`,
      description: user.bio || '',
      images: user.image ? [user.image] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${user.name || user.username} - LinkBio Brasil`,
      description: user.bio || '',
    },
  }
}
