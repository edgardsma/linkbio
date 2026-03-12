'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ShortLinkTable from '@/components/ShortLinkTable'
import Link from 'next/link'

export default function ShortLinksDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shorten')
      if (!response.ok) {
        throw new Error('Erro ao buscar links')
      }
      const data = await response.json()
      setLinks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchLinks()
    }
  }, [status, router])

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return

    try {
      const response = await fetch(`/api/shorten/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Erro ao excluir link')
      }
      await fetchLinks()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url)
    alert('URL copiada!')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              LB
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">
              LinkBio <span className="text-purple-600">Brasil</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/links"
              className="px-3 py-2 text-sm text-purple-600 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition font-medium"
            >
              Links Curtos
            </Link>
            <Link
              href="/profile"
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium"
            >
              Perfil
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Links Curtos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus links encurtados e acompanhe os cliques
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Links</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {links.length}
                </p>
              </div>
              <div className="text-3xl">🔗</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Cliques</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {links.reduce((sum, link) => sum + link.clicks, 0)}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Média por Link</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {links.length > 0
                    ? (links.reduce((sum, link) => sum + link.clicks, 0) / links.length).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.push('/dashboard/links/create')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            + Criar Novo Link
          </button>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Links Table */}
        <ShortLinkTable
          links={links}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onRefresh={fetchLinks}
        />

        {/* Empty State */}
        {links.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum link curto ainda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comece a encurtar links para acompanhar os cliques
            </p>
            <button
              onClick={() => router.push('/dashboard/links/create')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Criar Primeiro Link
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
