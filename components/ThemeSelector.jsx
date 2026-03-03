'use client'

import { useState, useEffect } from 'react'

export default function ThemeSelector({ currentColors, onThemeChange }) {
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customColors, setCustomColors] = useState({
    primaryColor: currentColors.primaryColor || '#667eea',
    secondaryColor: currentColors.secondaryColor || '#764ba2',
    backgroundColor: currentColors.backgroundColor || '#f9fafb',
    textColor: currentColors.textColor || '#111827',
  })
  const [applyingTheme, setApplyingTheme] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/themes')
      if (response.ok) {
        const data = await response.json()
        setThemes(data.themes)

        if (data.currentTheme && data.currentTheme.name !== 'custom') {
          setSelectedTheme(data.currentTheme.id)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar temas:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyTheme = async (themeId) => {
    setApplyingTheme(true)
    setError('')

    try {
      const response = await fetch('/api/user/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao aplicar tema')
      }

      const data = await response.json()
      onThemeChange({
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
      })

      setSelectedTheme(themeId)
    } catch (error) {
      setError(error.message)
    } finally {
      setApplyingTheme(false)
    }
  }

  const applyCustomTheme = async () => {
    setApplyingTheme(true)
    setError('')

    try {
      const response = await fetch('/api/user/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customColors),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao aplicar tema')
      }

      onThemeChange(customColors)
      setSelectedTheme(null)
    } catch (error) {
      setError(error.message)
    } finally {
      setApplyingTheme(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setShowCustom(false)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            !showCustom
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Temas
        </button>
        <button
          onClick={() => setShowCustom(true)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            showCustom
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Customizado
        </button>
      </div>

      {!showCustom && (
        <div className="grid grid-cols-3 gap-3">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              disabled={applyingTheme}
              className={`relative rounded-xl overflow-hidden border-2 transition hover:scale-105 ${
                selectedTheme === theme.id
                  ? 'border-purple-600'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
              style={{
                backgroundColor: theme.backgroundColor,
              }}
              title={theme.description}
            >
              <div className="p-4">
                <div
                  className="w-full h-8 rounded-lg mb-2"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <div
                  className="w-full h-4 rounded"
                  style={{ backgroundColor: theme.secondaryColor }}
                />
              </div>

              {theme.isPremium && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-white text-xs px-2 py-1 rounded font-bold">
                  PRO
                </div>
              )}

              {applyingTheme && selectedTheme === theme.id && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {showCustom && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              label="Cor Primária"
              value={customColors.primaryColor}
              onChange={(e) => setCustomColors({ ...customColors, primaryColor: e.target.value })}
            />
            <ColorInput
              label="Cor Secundária"
              value={customColors.secondaryColor}
              onChange={(e) => setCustomColors({ ...customColors, secondaryColor: e.target.value })}
            />
            <ColorInput
              label="Cor de Fundo"
              value={customColors.backgroundColor}
              onChange={(e) => setCustomColors({ ...customColors, backgroundColor: e.target.value })}
            />
            <ColorInput
              label="Cor do Texto"
              value={customColors.textColor}
              onChange={(e) => setCustomColors({ ...customColors, textColor: e.target.value })}
            />
          </div>

          {/* Preview */}
          <div
            className="rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700"
            style={{
              backgroundColor: customColors.backgroundColor,
              color: customColors.textColor,
            }}
          >
            <div
              className="w-full py-3 px-4 rounded-lg mb-2 text-center font-bold"
              style={{ backgroundColor: customColors.primaryColor }}
            >
              Botão Primário
            </div>
            <div
              className="w-full py-2 px-4 rounded text-center"
              style={{ backgroundColor: customColors.secondaryColor }}
            >
              Botão Secundário
            </div>
          </div>

          <button
            onClick={applyCustomTheme}
            disabled={applyingTheme}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {applyingTheme ? 'Aplicando...' : 'Aplicar Tema Customizado'}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

function ColorInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={onChange}
          className="w-12 h-10 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
        />
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}
