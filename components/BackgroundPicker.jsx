'use client'

import { useState, useRef } from 'react'

const GRADIENT_PRESETS = [
  { label: 'Roxo',      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Pôr do sol', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Oceano',    value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Floresta',  value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { label: 'Fogo',      value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: 'Noite',     value: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)' },
  { label: 'Aurora',    value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { label: 'Praia',     value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
]

export default function BackgroundPicker({ currentBackground, onSave }) {
  const [tab, setTab] = useState('upload') // 'upload' | 'gradient' | 'remove'
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const inputRef = useRef(null)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB')
      return
    }
    setFile(f)
    setError('')
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('background', file)
      const res = await fetch('/api/background', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no upload')
      setSuccess('Fundo atualizado!')
      onSave?.(data.url)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleGradient = async (gradient) => {
    setUploading(true)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background: gradient }),
      })
      if (!res.ok) throw new Error('Erro ao salvar gradiente')
      setSuccess('Fundo atualizado!')
      onSave?.(gradient)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background: '' }),
      })
      if (res.ok) { setSuccess('Fundo removido!'); onSave?.('') }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview atual */}
      {currentBackground && (
        <div
          className="w-full h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-cover bg-center"
          style={
            currentBackground.startsWith('linear-gradient')
              ? { backgroundImage: currentBackground }
              : { backgroundImage: `url(${currentBackground})` }
          }
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { id: 'upload',   label: 'Imagem' },
          { id: 'gradient', label: 'Gradiente' },
          { id: 'remove',   label: 'Remover' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              tab === t.id
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upload de imagem */}
      {tab === 'upload' && (
        <div className="space-y-3">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 transition"
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Clique para escolher uma imagem</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP · Máx 10MB</p>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-50"
            >
              {uploading ? 'Enviando...' : 'Aplicar imagem'}
            </button>
          )}
        </div>
      )}

      {/* Gradientes */}
      {tab === 'gradient' && (
        <div className="grid grid-cols-4 gap-2">
          {GRADIENT_PRESETS.map((g) => (
            <button
              key={g.label}
              onClick={() => handleGradient(g.value)}
              disabled={uploading}
              className="group relative rounded-xl overflow-hidden aspect-square border-2 border-transparent hover:border-purple-500 transition"
              style={{ backgroundImage: g.value }}
              title={g.label}
            >
              <span className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 group-hover:opacity-100 transition bg-black/20">
                <span className="text-white text-[10px] font-bold">{g.label}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Remover */}
      {tab === 'remove' && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Remove o fundo personalizado e volta ao padrão do tema.
          </p>
          <button
            onClick={handleRemove}
            disabled={uploading || !currentBackground}
            className="px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-semibold text-sm hover:bg-red-100 transition disabled:opacity-40"
          >
            {uploading ? 'Removendo...' : 'Remover fundo'}
          </button>
        </div>
      )}

      {error  && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">{success}</p>}
    </div>
  )
}
