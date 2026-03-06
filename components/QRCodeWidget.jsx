'use client'

import { useState, useEffect } from 'react'

export default function QRCodeWidget({ username }) {
  const [qrUrl, setQrUrl] = useState('')
  const [size, setSize] = useState(256)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (username) {
      generateQR()
    }
  }, [username, size])

  const generateQR = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/qr/${username}?size=${size}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setQrUrl(url)
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (!qrUrl) return

    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-${username}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        QR Code
      </h3>

      <div className="space-y-4">
        {/* Controles de Tamanho */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tamanho do QR Code
          </label>
          <div className="flex gap-2">
            {[128, 256, 512].map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-4 py-2 rounded-lg font-medium transition ${size === s
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {s}px
              </button>
            ))}
          </div>
        </div>

        {/* Preview do QR Code */}
        <div className="flex justify-center">
          {loading ? (
            <div className="animate-spin rounded-full h-48 w-48 border-b-2 border-purple-600"></div>
          ) : qrUrl ? (
            <div className="relative group">
              <img
                src={qrUrl}
                alt="QR Code"
                className="border-4 border-white dark:border-gray-700 rounded-lg shadow-lg"
                style={{ width: size, height: size }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  onClick={downloadQR}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
                >
                  📥 Baixar PNG
                </button>
              </div>
            </div>
          ) : (
            <div className="h-48 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Erro ao gerar QR Code</p>
            </div>
          )}
        </div>

        {/* Link Direto */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Aponte a câmera para escanear</p>
        </div>
      </div>
    </div>
  )
}
