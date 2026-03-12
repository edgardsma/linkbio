'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

const FONT_FAMILIES = [
  { value: 'inter', label: 'Inter (Moderno)' },
  { value: 'poppins', label: 'Poppins (Geométrico)' },
  { value: 'playfair', label: 'Playfair Display (Elegante)' },
  { value: 'montserrat', label: 'Montserrat (Profissional)' },
  { value: 'oswald', label: 'Oswald (Destaque)' },
  { value: 'roboto', label: 'Roboto (Clássico)' },
  { value: 'open-sans', label: 'Open Sans (Legível)' },
  { value: 'lato', label: 'Lato (Versátil)' },
]

const BUTTON_STYLES = [
  { value: 'rounded', label: 'Arredondado' },
  { value: 'square', label: 'Quadrado' },
  { value: 'outline', label: 'Contorno' },
]

export default function VisualEditor({ user, onSave }) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const [settings, setSettings] = useState({
    primaryColor: user.primaryColor || '#667eea',
    secondaryColor: user.secondaryColor || '#764ba2',
    backgroundColor: user.backgroundColor || '#f9fafb',
    textColor: user.textColor || '#111827',
    buttonStyle: user.buttonStyle || 'rounded',
    fontFamily: user.fontFamily || 'inter',
  })

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!session?.user?.id) {
      alert('Faça login para salvar as alterações')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert('Tema salvo com sucesso!')
        if (onSave) onSave(settings)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao salvar tema')
      }
    } catch (error) {
      alert('Erro ao salvar tema')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cores */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cores</h3>
        <div className="space-y-4">
          <ColorInput
            label="Cor Principal"
            value={settings.primaryColor}
            onChange={(value) => handleChange('primaryColor', value)}
          />
          <ColorInput
            label="Cor Secundária"
            value={settings.secondaryColor}
            onChange={(value) => handleChange('secondaryColor', value)}
          />
          <ColorInput
            label="Cor de Fundo"
            value={settings.backgroundColor}
            onChange={(value) => handleChange('backgroundColor', value)}
          />
          <ColorInput
            label="Cor do Texto"
            value={settings.textColor}
            onChange={(value) => handleChange('textColor', value)}
          />
        </div>
      </div>

      {/* Estilo dos Botões */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estilo dos Botões</h3>
        <div className="grid grid-cols-3 gap-4">
          {BUTTON_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => handleChange('buttonStyle', style.value)}
              className={`p-4 border-2 rounded-lg transition-all ${
                settings.buttonStyle === style.value
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-full h-10 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 100%)`,
                  borderRadius:
                    style.value === 'rounded'
                      ? '8px'
                      : style.value === 'square'
                        ? '4px'
                        : '8px',
                  border: style.value === 'outline' ? '2px solid ' + settings.primaryColor : 'none',
                }}
              />
              <p className="text-sm mt-2 font-medium text-gray-700">{style.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fonte */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fonte</h3>
        <select
          value={settings.fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Botão Salvar */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="w-full py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </div>
  )
}

function ColorInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded cursor-pointer border border-gray-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          placeholder="#667eea"
        />
      </div>
    </div>
  )
}
