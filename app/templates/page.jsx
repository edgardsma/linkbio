import { prisma } from '@/lib/prisma.js'
import TemplateGallery from '@/components/TemplateGallery'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)
  const templates = await prisma.theme.findMany({
    orderBy: { name: 'asc' },
  })

  async function handleUseTemplate(template) {
    'use server'
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        themeId: template.id,
        primaryColor: template.primaryColor,
        secondaryColor: template.secondaryColor,
        backgroundColor: template.backgroundColor,
        textColor: template.textColor,
        buttonStyle: template.buttonStyle,
        fontFamily: template.fontFamily,
      },
    })

    return { success: true }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Galeria de Templates</h1>
          <p className="text-gray-600 text-lg">
            Escolha o template perfeito para sua página de links
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <TemplateGallery
          templates={templates}
          onUseTemplate={async (template) => {
            const result = await handleUseTemplate(template)
            if (result.success) {
              alert('Template aplicado com sucesso!')
              window.location.href = '/dashboard'
            } else {
              alert('Erro ao aplicar template')
            }
          }}
        />
      </div>
    </div>
  )
}
