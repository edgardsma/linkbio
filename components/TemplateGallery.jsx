'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const FONT_LABELS = {
  inter: 'Inter',
  playfair: 'Playfair Display',
  montserrat: 'Montserrat',
  poppins: 'Poppins',
  oswald: 'Oswald',
}

const BUTTON_LABELS = {
  rounded: 'Arredondado',
  square: 'Quadrado',
  outline: 'Contorno',
}

function TemplateCard({ template, onUse }) {
  const btnClass = {
    rounded: 'rounded-full',
    square: 'rounded-md',
    outline: 'rounded-full border-2',
  }[template.buttonStyle] || 'rounded-full'

  const btnStyle =
    template.buttonStyle === 'outline'
      ? {
          borderColor: template.primaryColor,
          color: template.primaryColor,
          backgroundColor: 'transparent',
        }
      : {
          background: `linear-gradient(135deg, ${template.primaryColor}, ${template.secondaryColor})`,
          color: '#fff',
        }

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      {/* Preview */}
      <div
        className="h-52 flex flex-col items-center justify-center px-6 py-5 gap-2 relative"
        style={{ backgroundColor: template.backgroundColor }}
      >
        {template.isPremium && (
          <span className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
            PRO
          </span>
        )}
        {/* Avatar simulado */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-1 border-2"
          style={{
            backgroundColor: template.primaryColor + '20',
            borderColor: template.primaryColor,
            color: template.textColor,
          }}
        >
          {template.category[0]}
        </div>
        <p className="text-xs font-semibold" style={{ color: template.textColor }}>
          @usuario
        </p>
        {/* Links simulados */}
        {['Link 1', 'Link 2'].map((l) => (
          <div
            key={l}
            className={`w-full text-center text-xs py-1.5 font-medium ${btnClass}`}
            style={btnStyle}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-gray-900 dark:text-white">{template.name}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
            {BUTTON_LABELS[template.buttonStyle]}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {template.description}
        </p>
        {/* Paleta de cores */}
        <div className="flex items-center gap-1.5 mb-4">
          {[template.primaryColor, template.secondaryColor, template.backgroundColor, template.textColor].map(
            (color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: color }}
                title={color}
              />
            )
          )}
          <span className="text-xs text-gray-400 ml-1">{FONT_LABELS[template.fontFamily] || template.fontFamily}</span>
        </div>
        <button
          onClick={() => onUse(template)}
          className="w-full py-2 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
        >
          Usar este template
        </button>
      </div>
    </div>
  )
}

export default function TemplateGallery({ templates, categories, activeCategory: initialCategory }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [applying, setApplying] = useState(null)
  const [success, setSuccess] = useState(null)
  const { data: session } = useSession()
  const router = useRouter()

  const filtered =
    activeCategory === 'Todos'
      ? templates
      : templates.filter((t) => t.category === activeCategory)

  const handleUse = async (template) => {
    if (!session) {
      router.push(`/auth/signup?template=${template.id}`)
      return
    }
    setApplying(template.id)
    try {
      const res = await fetch('/api/profile/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: template.id }),
      })
      if (res.ok) {
        setSuccess(template.id)
        setTimeout(() => {
          router.push('/dashboard/edit')
        }, 1000)
      }
    } finally {
      setApplying(null)
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeCategory === cat
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-purple-300 hover:text-purple-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Contagem */}
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''}{' '}
        {activeCategory !== 'Todos' ? `em ${activeCategory}` : 'no total'}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((template) => (
          <div key={template.id} className="relative">
            <TemplateCard template={template} onUse={handleUse} />
            {applying === template.id && (
              <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 rounded-2xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            )}
            {success === template.id && (
              <div className="absolute inset-0 bg-green-50/90 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <div className="text-green-600 font-bold text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aplicado!
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
