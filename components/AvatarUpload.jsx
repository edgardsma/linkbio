'use client'

import { useState, useRef } from 'react'

export default function AvatarUpload({ currentAvatar, onAvatarChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB')
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
    formData.append('avatar', file)

    try {
      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      onAvatarChange(data.url)
    } catch (error) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-700">
        {currentAvatar ? (
          <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="flex-grow">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Foto do perfil
        </p>
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
          {uploading ? 'Enviando...' : 'Alterar Foto'}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Máximo 5MB. Formatos: JPEG, PNG, WebP
        </p>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
