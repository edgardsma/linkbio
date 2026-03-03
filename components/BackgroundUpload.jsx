'use client'

import { useState, useRef } from 'react'

export default function BackgroundUpload({ currentBackground, onBackgroundChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB')
      return
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP')
      return
    }

    setError('')
    setUploading(true)

    const formData = new FormData()
    formData.append('background', file)

    try {
      const response = await fetch('/api/background', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      onBackgroundChange(data.url)
    } catch (error) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Imagem de Fundo
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {uploading ? 'Enviando...' : 'Carregar Imagem'}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Máximo 10MB. Formatos: JPEG, PNG, WebP
        </p>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            {error}
          </p>
        )}
      </div>

      {/* Preview do Background */}
      {currentBackground && (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={currentBackground}
            alt="Preview do fundo"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
          <p className="absolute bottom-2 left-2 text-white text-xs font-medium">
            Fundo atual
          </p>
        </div>
      )}
    </div>
  )
}
