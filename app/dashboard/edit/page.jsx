'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import VisualEditor from '@/components/VisualEditor'
import BackgroundPicker from '@/components/BackgroundPicker'

const FONT_MAP = {
  inter:      '"Inter", sans-serif',
  poppins:    '"Poppins", sans-serif',
  montserrat: '"Montserrat", sans-serif',
  playfair:   '"Playfair Display", serif',
  oswald:     '"Oswald", sans-serif',
}

// ─── Preview de perfil em tempo real ─────────────────────────────────────────

function LivePreview({ theme, links, user }) {
  const colors = {
    primary:    theme.primaryColor    || '#667eea',
    secondary:  theme.secondaryColor  || '#764ba2',
    background: theme.backgroundColor || '#f9fafb',
    text:       theme.textColor       || '#111827',
  }

  const btnClass = {
    rounded: 'rounded-full',
    square:  'rounded-lg',
    outline: 'rounded-full border-2',
  }[theme.buttonStyle] || 'rounded-full'

  const btnStyle =
    theme.buttonStyle === 'outline'
      ? { borderColor: colors.primary, color: colors.primary, backgroundColor: 'transparent' }
      : { background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: '#fff' }

  const bg = theme.background
    ? theme.background.startsWith('linear-gradient')
      ? { backgroundImage: theme.background }
      : { backgroundImage: `url(${theme.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: colors.background }

  return (
    /* Moldura de celular */
    <div className="mx-auto" style={{ width: 300 }}>
      <div className="relative rounded-[2.5rem] overflow-hidden border-[6px] border-gray-800 dark:border-gray-700 shadow-2xl" style={{ height: 580 }}>
        {/* Status bar */}
        <div className="bg-gray-900 text-white text-[10px] flex justify-between px-5 py-1.5">
          <span>9:41</span>
          <span>●●●</span>
        </div>

        {/* Conteúdo */}
        <div className="h-full overflow-y-auto pb-6" style={{ ...bg, fontFamily: FONT_MAP[theme.fontFamily] || 'sans-serif' }}>
          {/* Faixa gradiente no topo */}
          <div
            className="h-24"
            style={{ background: `linear-gradient(180deg, ${colors.primary}30, transparent)` }}
          />

          <div className="px-5 -mt-10 text-center">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold border-4 bg-white overflow-hidden"
              style={{ borderColor: colors.primary }}
            >
              {user?.image
                ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                : (user?.name?.[0] || 'U').toUpperCase()
              }
            </div>
            <p className="font-bold text-sm mb-0.5" style={{ color: colors.text }}>
              {user?.name || 'Seu Nome'}
            </p>
            <p className="text-xs opacity-60 mb-4" style={{ color: colors.text }}>
              {user?.bio || 'Sua bio aparece aqui'}
            </p>

            {/* Links */}
            <div className="space-y-2.5">
              {(links.length > 0 ? links.slice(0, 5) : [
                { id: '1', title: 'Meu Site', isActive: true },
                { id: '2', title: 'Instagram', isActive: true },
                { id: '3', title: 'WhatsApp', isActive: true },
              ]).filter(l => l.isActive).map((link) => (
                <div
                  key={link.id}
                  className={`w-full py-2.5 px-4 text-xs font-semibold text-center ${btnClass}`}
                  style={btnStyle}
                >
                  {link.icon && <span className="mr-1.5">{link.icon}</span>}
                  {link.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Indicador */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">Preview em tempo real</p>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'visual',     label: 'Visual' },
  { id: 'background', label: 'Fundo' },
  { id: 'templates',  label: 'Templates' },
]

function EditContent() {
  const { data: session } = useSession()
  const [theme, setTheme] = useState({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f9fafb',
    textColor: '#111827',
    buttonStyle: 'rounded',
    fontFamily: 'inter',
    background: '',
  })
  const [links, setLinks] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('visual')
  const [loading, setLoading] = useState(true)

  // Carregar tema e links atuais
  useEffect(() => {
    if (!session?.user?.id) return
    Promise.all([
      fetch('/api/profile/theme').then(r => r.json()),
      fetch('/api/links').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([themeData, linksData, profileData]) => {
      setTheme({
        primaryColor:    themeData.primaryColor    || '#667eea',
        secondaryColor:  themeData.secondaryColor  || '#764ba2',
        backgroundColor: themeData.backgroundColor || '#f9fafb',
        textColor:       themeData.textColor       || '#111827',
        buttonStyle:     themeData.buttonStyle     || 'rounded',
        fontFamily:      themeData.fontFamily      || 'inter',
        background:      profileData.background    || '',
      })
      setLinks(linksData || [])
    }).finally(() => setLoading(false))
  }, [session])

  const handleSave = async (newTheme) => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/profile/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTheme),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = useCallback((next) => {
    setTheme(prev => ({ ...prev, ...next }))
  }, [])

  const handleBackgroundSave = (url) => {
    setTheme(prev => ({ ...prev, background: url }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">Editor Visual</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Personalize sua página</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${session?.user?.username}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver página
            </Link>
            {saved && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvo
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Split Screen */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Painel de edição ── */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 sticky top-24">
              {/* Tabs do painel */}
              <div className="flex border-b border-gray-100 dark:border-gray-800">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex-1 py-3 text-sm font-semibold transition ${
                      activeTab === t.id
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                {activeTab === 'visual' && (
                  <VisualEditor
                    initialTheme={theme}
                    onThemeChange={handleThemeChange}
                    onSave={handleSave}
                    saving={saving}
                  />
                )}
                {activeTab === 'background' && (
                  <BackgroundPicker
                    currentBackground={theme.background}
                    onSave={handleBackgroundSave}
                  />
                )}
                {activeTab === 'templates' && (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Explore todos os templates disponíveis
                    </p>
                    <Link
                      href="/templates"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition"
                    >
                      Ver galeria de templates
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Preview em tempo real ── */}
          <div className="flex-1 flex items-start justify-center">
            <div className="w-full">
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 mb-6">
                As alterações aparecem em tempo real →
              </p>
              <LivePreview theme={theme} links={links} user={session?.user} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function EditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    }>
      <EditContent />
    </Suspense>
  )
}
