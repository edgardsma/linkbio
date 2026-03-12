import { Suspense } from 'react'
import TemplateGallery from '@/components/TemplateGallery'
import prisma from '@/lib/prisma'
import Link from 'next/link'

export const metadata = {
  title: 'Templates | LinkBio Brasil',
  description: 'Escolha um template profissional para sua página de links.',
}

async function getTemplates() {
  return prisma.theme.findMany({ orderBy: { category: 'asc' } })
}

export default async function TemplatesPage({ searchParams }) {
  const templates = await getTemplates()
  const params = await searchParams
  const activeCategory = params?.categoria || 'Todos'

  const categories = ['Todos', ...new Set(templates.map((t) => t.category))]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              LB
            </div>
            <span className="font-bold text-gray-900 dark:text-white hidden sm:block">
              LinkBio <span className="text-purple-600">Brasil</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 transition"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 text-white py-16 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Templates Profissionais
        </h1>
        <p className="text-purple-100 text-lg max-w-xl mx-auto mb-8">
          Escolha um template e personalize com suas cores. Pronto em segundos.
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-xl font-bold hover:bg-purple-50 transition shadow-lg"
        >
          Começar grátis
        </Link>
      </section>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Carregando...</div>}>
          <TemplateGallery
            templates={templates}
            categories={categories}
            activeCategory={activeCategory}
          />
        </Suspense>
      </main>
    </div>
  )
}
