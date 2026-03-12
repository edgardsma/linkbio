import { prisma } from '@/lib/prisma.js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import VisualEditor from '@/components/VisualEditor'

export const dynamic = 'force-dynamic'

export default async function EditPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      links: {
        where: { isActive: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Personalizar Página</h1>
        </div>
      </div>

      {/* Conteúdo Split Screen */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor - Lado Esquerdo */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Editor Visual</h2>
              <VisualEditor user={user} />
            </div>

            {/* Background Picker - Tarefa 4 */}
            <BackgroundPicker user={user} />
          </div>

          {/* Preview - Lado Direito */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
                <a
                  href={`/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  Ver ao vivo →
                </a>
              </div>
              
              <ProfilePreview user={user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de Preview do Perfil
function ProfilePreview({ user }) {
  const colors = {
    primary: user.primaryColor || '#667eea',
    secondary: user.secondaryColor || '#764ba2',
    background: user.backgroundColor || '#f9fafb',
    text: user.textColor || '#111827',
  }

  return (
    <div
      className="min-h-[600px] rounded-2xl p-8 space-y-6 overflow-hidden"
      style={{
        backgroundColor: colors.background,
        backgroundImage: user.background ? `url(${user.background})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Avatar */}
      <div className="text-center">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || user.username}
            className="w-24 h-24 rounded-full mx-auto border-4"
            style={{ borderColor: colors.primary }}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full mx-auto border-4 flex items-center justify-center text-4xl font-bold text-white"
            style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
          >
            {(user.name || user.username)?.[0]?.toUpperCase()}
          </div>
        )}
        <h2
          className="text-2xl font-bold mt-4"
          style={{ color: colors.text }}
        >
          {user.name || user.username}
        </h2>
        {user.bio && (
          <p
            className="text-sm mt-2"
            style={{ color: colors.text, opacity: 0.8 }}
          >
            {user.bio}
          </p>
        )}
      </div>

      {/* Links */}
      <div className="space-y-3">
        {user.links.map((link) => (
          <a
            key={link.id}
            href="#"
            className="block p-4 rounded-xl transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              color: 'white',
              borderRadius: user.buttonStyle === 'rounded' ? '12px' : user.buttonStyle === 'square' ? '8px' : '12px',
            }}
          >
            <div className="flex items-center gap-3">
              {link.icon && <span className="text-xl">{link.icon}</span>}
              <span className="font-semibold">{link.title}</span>
            </div>
          </a>
        ))}
        
        {user.links.length === 0 && (
          <div
            className="text-center py-12"
            style={{ color: colors.text, opacity: 0.6 }}
          >
            <p>Nenhum link adicionado</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de Background Picker - Tarefa 4
async function BackgroundPicker({ user }) {
  async function handleUpload(formData) {
    'use server'
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    // TODO: Implementar upload para S3/Cloudflare R2
    // Por enquanto, vamos usar URL direta
    const backgroundUrl = formData.get('background')

    if (backgroundUrl) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { background: backgroundUrl },
      })
    }

    return { success: true }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Background Personalizado</h3>
      
      <form action={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL da Imagem de Fundo
          </label>
          <input
            type="url"
            name="background"
            defaultValue={user.background || ''}
            placeholder="https://example.com/image.jpg"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          Salvar Background
        </button>
      </form>

      <div className="mt-4 pt-4 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gradiente Pré-definido
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'].map((gradient, i) => (
            <BackgroundGradientButton key={i} gradient={gradient} />
          ))}
        </div>
      </div>
    </div>
  )
}

function BackgroundGradientButton({ gradient }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { background: gradient },
          })
        }
      }}
      className="h-20 rounded-lg border-2 border-gray-200 hover:border-purple-600 transition-all"
      style={{ background: gradient }}
    />
  )
}
