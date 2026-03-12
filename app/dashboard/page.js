'use client'

import { useSession, signOut } from 'next-auth/react'
import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import AnalyticsCharts from '@/components/AnalyticsCharts'
import QRCodeWidget from '@/components/QRCodeWidget'
import EditLinkModal from '@/components/EditLinkModal'
import LinkTypeSelector, { getLinkPlaceholder, formatLinkUrl } from '@/components/LinkTypeSelector'
import MobilePreview from '@/components/MobilePreview'
import DraggableLinkList from '@/components/DraggableLinkList'
import OnboardingChecklist from '@/components/OnboardingChecklist'
import UpgradeBanner from '@/components/UpgradeBanner'
import { shouldShowOnboarding } from '@/lib/onboarding.js'

// ─── Ícones SVG inline ────────────────────────────────────────────────────────

const IconLink = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)
const IconClick = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
  </svg>
)
const IconActive = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconCopy = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)
const IconCheck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)
const IconExternal = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)
const IconPlus = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)
const IconSignOut = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

// ─── Card de Estatística ──────────────────────────────────────────────────────

function StatCard({ icon, label, value, gradient, sub }) {
  return (
    <div className={`rounded-2xl p-5 text-white ${gradient} shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
        </div>
        <div className="bg-white/20 rounded-xl p-2.5">
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Content ────────────────────────────────────────────────────────

function DashboardContent() {
  const { data: session, status } = useSession()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [onboardingStatus, setOnboardingStatus] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(true)

  const fetchLinks = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (session?.user?.id) fetchLinks()
  }, [session, fetchLinks])

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          setUserProfile(data.user)
          setOnboardingStatus(data.onboarding)
          if (!shouldShowOnboarding(data.onboarding, data.user.onboardingDismissed)) {
            setShowOnboarding(false)
          }
        })
        .catch(err => console.error('Erro ao buscar perfil:', err))
    }
  }, [session])

  const handleToggleLink = async (linkId, isActive) => {
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (response.ok) fetchLinks()
    } catch (error) {
      console.error('Erro ao atualizar link:', error)
    }
  }

  const handleDeleteLink = async (linkId) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return
    try {
      const response = await fetch(`/api/links/${linkId}`, { method: 'DELETE' })
      if (response.ok) fetchLinks()
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
    try {
      const response = await fetch('/api/links/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: reorderedLinks.map(link => ({ id: link.id, position: link.position })),
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao reordenar links')
      }
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error)
      fetchLinks()
    }
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Acesso não autorizado</h1>
          <Link href="/auth/login" className="text-purple-600 hover:underline">
            Faça login para continuar
          </Link>
        </div>
      </div>
    )
  }

  const profileUrl = `${window.location.origin}/${session.user.username}`
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0)
  const activeLinks = links.filter(l => l.isActive).length
  const firstName = session.user?.name?.split(' ')[0] || 'usuário'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              LB
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">
              LinkBio <span className="text-purple-600">Brasil</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/profile"
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium"
            >
              Perfil
            </Link>
            <Link
              href="/templates"
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium"
            >
              Templates
            </Link>
            <Link
              href="/dashboard/billing"
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium"
            >
              Planos
            </Link>
            <Link
              href={profileUrl}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium"
            >
              <IconExternal />
              Ver página
            </Link>

            {/* Avatar + Sair */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {session.user?.image
                  ? <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                  : (session.user?.name?.[0] || 'U').toUpperCase()
                }
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                title="Sair"
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <IconSignOut />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Banner de Upgrade ── */}
        {userProfile?.subscription && (
          <UpgradeBanner currentPlan={userProfile.subscription.plan} />
        )}

        {/* ── Boas-vindas ── */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-purple-200 text-sm font-medium mb-1">Bem-vindo de volta 👋</p>
              <h1 className="text-2xl sm:text-3xl font-bold">{firstName}</h1>
              <p className="text-purple-200 text-sm mt-1">@{session.user?.username}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 rounded-xl font-semibold text-sm hover:bg-purple-50 transition shadow-sm"
              >
                <IconPlus />
                Novo Link
              </button>
              <Link
                href={profileUrl}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition"
              >
                <IconExternal />
                Ver página
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<IconLink />}
            label="Total de Links"
            value={links.length}
            sub={`${activeLinks} ativos`}
            gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          />
          <StatCard
            icon={<IconActive />}
            label="Links Ativos"
            value={activeLinks}
            sub={links.length > 0 ? `${Math.round((activeLinks / links.length) * 100)}% do total` : 'Adicione links'}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          />
          <StatCard
            icon={<IconClick />}
            label="Total de Cliques"
            value={totalClicks}
            sub="em todos os links"
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
        </div>

        {/* ── Checklist de Onboarding ── */}
        {showOnboarding && onboardingStatus && (
          <OnboardingChecklist
            status={onboardingStatus}
            onDismiss={() => setShowOnboarding(false)}
            userId={session.user.id}
          />
        )}

        {/* ── Conteúdo Principal ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Coluna Esquerda — Links */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card URL da página */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">Sua página pública</p>
                <p className="text-purple-600 dark:text-purple-400 font-semibold truncate">{profileUrl}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleCopyUrl}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    copied
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400'
                  }`}
                >
                  {copied ? <IconCheck /> : <IconCopy />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <Link
                  href={profileUrl}
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
                >
                  <IconExternal />
                  Abrir
                </Link>
              </div>
            </div>

            {/* Card Lista de Links */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Meus Links</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                    {links.length === 0 ? 'Nenhum link ainda' : `${links.length} link${links.length !== 1 ? 's' : ''} · arraste para reordenar`}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-sm shadow-sm"
                >
                  <IconPlus />
                  Adicionar
                </button>
              </div>

              <div className="p-4">
                {links.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-lg mb-1">
                      Nenhum link ainda
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                      Adicione links para Instagram, WhatsApp, site, portfólio e muito mais.
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-sm"
                    >
                      <IconPlus />
                      Criar primeiro link
                    </button>
                  </div>
                ) : (
                  <DraggableLinkList
                    links={links}
                    onReorder={handleReorder}
                    onToggle={handleToggleLink}
                    onEdit={handleEditLink}
                    onDelete={handleDeleteLink}
                  />
                )}
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <AnalyticsCharts />
            </div>
          </div>

          {/* Coluna Direita — Ferramentas */}
          <div className="space-y-6">

            {/* Card Perfil Rápido */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Seu Perfil</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-400 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
                  {session.user?.image
                    ? <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                    : (session.user?.name?.[0] || 'U').toUpperCase()
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{session.user?.name}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">@{session.user?.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/profile"
                  className="flex-1 flex items-center justify-center px-3 py-2.5 border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-xl font-semibold text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                >
                  Editar Perfil
                </Link>
                <Link
                  href="/dashboard/edit"
                  className="flex-1 flex items-center justify-center px-3 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition"
                >
                  🎨 Personalizar
                </Link>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <QRCodeWidget username={session?.user?.username} />
            </div>

            {/* Preview Mobile */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <MobilePreview username={session?.user?.username} links={links} userTheme={session?.user} />
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal Adicionar Link ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Novo Link</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AddLinkForm onClose={() => setShowAddModal(false)} onAdd={fetchLinks} />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Link ── */}
      {showEditModal && editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => { setShowEditModal(false); setEditingLink(null) }}
          onUpdate={fetchLinks}
        />
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

// ─── Formulário Adicionar Link ────────────────────────────────────────────────

const socialPresets = [
  { title: 'Instagram', url: 'https://instagram.com/', icon: '📸', type: 'url' },
  { title: 'TikTok',    url: 'https://tiktok.com/@',   icon: '🎵', type: 'url' },
  { title: 'X/Twitter', url: 'https://twitter.com/',   icon: '🐦', type: 'url' },
  { title: 'WhatsApp',  url: '',                        icon: '💬', type: 'whatsapp' },
  { title: 'YouTube',   url: 'https://youtube.com/',   icon: '▶️', type: 'url' },
  { title: 'LinkedIn',  url: 'https://linkedin.com/in/', icon: '💼', type: 'url' },
]

function AddLinkForm({ onClose, onAdd }) {
  const [formData, setFormData] = useState({ title: '', url: '', description: '', icon: '', type: 'url' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePresetClick = (preset) => {
    setFormData({ ...formData, title: preset.title, url: preset.url, icon: preset.icon, type: preset.type })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formattedUrl = formatLinkUrl(formData.type, formData.url)
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, url: formattedUrl }),
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
      {/* Atalhos rápidos */}
      <div>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Adicionar rapidamente
        </p>
        <div className="flex flex-wrap gap-2">
          {socialPresets.map(preset => (
            <button
              key={preset.title}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition font-medium"
            >
              <span>{preset.icon}</span>
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
        <LinkTypeSelector
          value={formData.type}
          onChange={(type) => setFormData({ ...formData, type })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
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
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ícone</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm text-center"
              placeholder="🔗"
              maxLength={2}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-sm"
        >
          {loading ? 'Adicionando...' : 'Adicionar Link'}
        </button>
      </div>
    </form>
  )
}
