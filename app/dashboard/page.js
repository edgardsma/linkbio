'use client'

import { useSession } from 'next-auth/react'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import AnalyticsCharts from '@/components/AnalyticsCharts'
import QRCodeWidget from '@/components/QRCodeWidget'
import EditLinkModal from '@/components/EditLinkModal'
import LinkTypeSelector, { getLinkPlaceholder, formatLinkUrl } from '@/components/LinkTypeSelector'
import MobilePreview from '@/components/MobilePreview'
import DraggableLinkList from '@/components/DraggableLinkList'

function DashboardContent() {
  const { data: session, status } = useSession()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLink, setEditingLink] = useState(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchLinks()
    }
  }, [session])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links')
      if (response.ok) {
        const data = await response.json()
        setLinks(data)
      }
    } catch (error) {
      console.error('Erro ao buscar links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLink = async (linkId, isActive) => {
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchLinks()
      }
    } catch (error) {
      console.error('Erro ao atualizar link:', error)
    }
  }

  const handleDeleteLink = async (linkId) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchLinks()
      }
    } catch (error) {
      console.error('Erro ao excluir link:', error)
    }
  }

  const handleEditLink = (link) => {
    setEditingLink(link)
    setShowEditModal(true)
  }

  const handleReorder = async (reorderedLinks) => {
    setLinks(reorderedLinks)

    // Atualizar posições no banco de dados usando o endpoint de reordenar
    try {
      const response = await fetch('/api/links/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: reorderedLinks.map(link => ({
            id: link.id,
            position: link.position,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao reordenar links')
      }
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error)
      fetchLinks() // Reverter em caso de erro
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso não autorizado</h1>
          <Link href="/auth/login" className="text-purple-600 hover:underline">
            Faça login para continuar
          </Link>
        </div>
      </div>
    )
  }

  const profileUrl = `${window.location.origin}/${session.user.username}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            LinkBio Brasil
          </Link>
          <nav className="flex gap-4 items-center">
            <Link href="/dashboard" className="text-purple-600 dark:text-purple-400 font-semibold">
              Dashboard
            </Link>
            <Link href="/profile" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Meu Perfil
            </Link>
            <span className="text-gray-600 dark:text-gray-300">{session.user?.name}</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Link Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Meus Links
                </h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  + Adicionar Link
                </button>
              </div>

              {links.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <p className="text-lg">Você ainda não tem links</p>
                  <p className="mt-2">Clique em "Adicionar Link" para começar</p>
                </div>
              ) : (
                <DraggableLinkList links={links} onReorder={handleReorder} />
              )}
            </div>
          </div>

          {/* Right Column - Profile Preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Sua Página
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Seu link:</p>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:underline break-all"
                >
                  {profileUrl}
                </a>
              </div>
              <Link
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Visualizar Página
              </Link>
            </div>

            <AnalyticsCharts />

            <QRCodeWidget username={session?.user?.username} />

            <MobilePreview username={session?.user?.username} links={links} userTheme={session?.user} />
          </div>
        </div>
      </main>

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Adicionar Novo Link
              </h3>
              <AddLinkForm onClose={() => setShowAddModal(false)} onAdd={fetchLinks} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {showEditModal && editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => {
            setShowEditModal(false)
            setEditingLink(null)
          }}
          onUpdate={fetchLinks}
        />
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
      <DashboardContent />
    </Suspense>
  )
}

function AddLinkForm({ onClose, onAdd }) {
  const [formData, setFormData] = useState({ title: '', url: '', description: '', icon: '', type: 'url' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const socialPresets = [
    { title: 'Instagram', url: 'https://instagram.com/', icon: '📸', type: 'url' },
    { title: 'TikTok', url: 'https://tiktok.com/@', icon: '🎵', type: 'url' },
    { title: 'X (Twitter)', url: 'https://twitter.com/', icon: '🐦', type: 'url' },
    { title: 'WhatsApp', url: '', icon: '💬', type: 'whatsapp' },
  ]

  const handlePresetClick = (preset) => {
    setFormData({
      ...formData,
      title: preset.title,
      url: preset.url,
      icon: preset.icon,
      type: preset.type
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Formatar a URL conforme o tipo de link
      const formattedUrl = formatLinkUrl(formData.type, formData.url)

      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          url: formattedUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar link')
      }

      onAdd()
      onClose()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sugestões Rápidas */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Adicionar rapidamente
        </label>
        <div className="flex flex-wrap gap-2">
          {socialPresets.map(preset => (
            <button
              key={preset.title}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-100 dark:border-gray-600 text-purple-700 dark:text-purple-300 text-sm rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 transition flex items-center gap-2 font-medium"
            >
              <span>{preset.icon}</span>
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de Link */}
      <LinkTypeSelector
        value={formData.type}
        onChange={(type) => setFormData({ ...formData, type })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Título *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Meu Site"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {formData.type === 'url' ? 'URL' : formData.type === 'whatsapp' ? 'WhatsApp' : formData.type === 'email' ? 'Email' : 'Telefone'} *
        </label>
        <input
          type={formData.type === 'url' ? 'url' : 'text'}
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
          placeholder={getLinkPlaceholder(formData.type)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descrição
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Descrição opcional do link"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ícone (emoji)
        </label>
        <input
          type="text"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="🔗"
          maxLength={2}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
