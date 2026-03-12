'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TemplateGallery({ templates = [], onUseTemplate }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const { data: session } = useSession()

  const categories = ['Todos', ...new Set(templates.map((t) => t.category))]

  const filteredTemplates =
    selectedCategory === 'Todos'
      ? templates
      : templates.filter((t) => t.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Filtros por categoria */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={onUseTemplate}
            isAuthenticated={!!session}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum template encontrado</p>
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template, onUse, isAuthenticated }) {
  const [isHovered, setIsHovered] = useState(false)

  const handleUseTemplate = () => {
    if (!isAuthenticated) {
      alert('Faça login para usar este template')
      window.location.href = '/auth/login'
      return
    }
    onUseTemplate(template)
  }

  return (
    <div
      className="border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview do template */}
      <div
        className="h-48 relative"
        style={{
          backgroundColor: template.backgroundColor,
          background: isHovered
            ? `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%)`
            : template.backgroundColor,
        }}
      >
        {/* Exemplo de botões no preview */}
        <div className="absolute inset-4 space-y-3">
          <div
            className="h-8 rounded-lg opacity-60"
            style={{
              background: `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%)`,
              borderRadius: template.buttonStyle === 'rounded' ? '8px' : template.buttonStyle === 'square' ? '4px' : '8px',
            }}
          />
          <div
            className="h-8 rounded-lg opacity-60"
            style={{
              background: `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%)`,
              borderRadius: template.buttonStyle === 'rounded' ? '8px' : template.buttonStyle === 'square' ? '4px' : '8px',
            }}
          />
          <div
            className="h-8 rounded-lg opacity-60"
            style={{
              background: `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%)`,
              borderRadius: template.buttonStyle === 'rounded' ? '8px' : template.buttonStyle === 'rounded' ? '8px' : '8px',
            }}
          />
        </div>

        {/* Badge Premium */}
        {template.isPremium && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
            PRO
          </div>
        )}
      </div>

      {/* Informações do template */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {template.category}
            </span>
          </div>
          {template.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
          )}
        </div>

        <button
          onClick={handleUseTemplate}
          className={`w-full py-3 font-semibold rounded-lg transition-all hover:scale-105 ${
            template.isPremium
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
          style={{
            borderRadius: template.buttonStyle === 'rounded' ? '8px' : template.buttonStyle === 'square' ? '4px' : '8px',
          }}
        >
          {template.isPremium ? 'Usar Template PRO' : 'Usar Template'}
        </button>
      </div>
    </div>
  )
}
