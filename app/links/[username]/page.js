/**
 * Página de Links Simplificada - Estilo Linktree
 * Versão minimalista com cards de links em gradiente
 */

import { prisma } from '@/lib/prisma.js'

// Função para registrar cliques em background
async function trackClick(linkId) {
  try {
    await prisma.link.update({
      where: { id: linkId },
      data: { clicks: { increment: 1 } },
    })
  } catch (error) {
    console.error('Erro ao registrar clique:', error)
  }
}

export const dynamic = 'force-dynamic'

export default async function LinksPage({ params }) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-600 p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            @{usernameClean}
          </h1>
          <p className="text-gray-500">Usuário não encontrado</p>
          <a href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Voltar para a página inicial
          </a>
        </div>
      </div>
    )
  }

  // Cores do tema
  const colors = {
    primary: user.primaryColor || '#667eea',
    secondary: user.secondaryColor || '#764ba2',
    bg: user.backgroundColor || '#f9fafb',
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})`,
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}
    >
      {/* Header com avatar */}
      <div className="text-center mb-8 pt-8">
        <a
          href="/"
          className="inline-block"
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-32 h-32 rounded-full border-4 shadow-lg"
              style={{ borderColor: colors.primary }}
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 shadow-lg flex items-center justify-center text-4xl font-bold" style={{ backgroundColor: colors.primary, color: 'white' }}>
              {user.name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
            </div>
          )}
        </a>

        <h1
          className="text-4xl font-bold mb-2 text-white"
        >
          {user.name || user.username}
        </h1>

        {user.bio && (
          <p className="text-white/80 text-center mb-4 max-w-xs mx-auto">
            {user.bio}
          </p>
        )}
      </div>

      {/* Links em cards estilo Linktree */}
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <div className="space-y-4">
          {user.links.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg p-12">
                <p className="text-6xl mb-4">🔗</p>
                <p className="text-gray-700 mb-2">Nenhum link adicionado ainda</p>
                <p className="text-gray-500 text-sm mb-6">
                  @{usernameClean} ainda não tem links
                </p>
                <a
                  href="/"
                  className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Criar sua página grátis
                </a>
              </div>
            </div>
          ) : (
            user.links.map((link, index) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(link.id)}
                className="group block p-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-2xl/50"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  transform: `translateY(${index * 8}px)`,
                  opacity: 0,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Ícone */}
                  <div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-100 p-3 flex items-center justify-center"
                    style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    {link.icon || (
                      <span className="text-2xl">{link.icon}</span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-grow">
                    <h3 className="font-semibold text-white text-lg truncate">
                      {link.title}
                    </h3>
                    {link.description && (
                      <p className="text-white/90 truncate text-sm">
                        {link.description}
                      </p>
                    )}
                  </div>

                  {/* Contador de cliques */}
                  {link.clicks > 0 && (
                    <span className="text-xs font-medium text-white/60 ml-auto">
                      {link.clicks} {link.clicks === 1 ? 'clique' : 'cliques'}
                    </span>
                  )}
                </div>

                {/* Seta */}
                <svg
                  className="w-6 h-6 text-white/40 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
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
        <div className="text-center py-8 mt-12">
          <a
            href="/"
            className="text-white/80 hover:text-white font-medium"
          >
            Criar sua página no LinkBio Brasil
          </a>
        </div>
      </div>
    </div>
  )
}

// Configuração de SEO
export async function generateMetadata({ params }) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username: username.replace('@', '').toLowerCase() },
  })

  if (!user) {
    return {
      title: 'Usuário não encontrado',
      description: 'Página não existe',
    }
  }

  return {
    title: `${user.name || user.username} - Links`,
    description: user.bio || `Confira os links de ${user.name || user.username}`,
    openGraph: {
      title: `${user.name || user.username} - Links`,
      description: user.bio || '',
      images: user.image ? [user.image] : [],
    },
  }
}
