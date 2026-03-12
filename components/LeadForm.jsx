'use client'

import { useState } from 'react'

export default function LeadForm({ link, themeColors }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, linkId: link.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao enviar')
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setForm({ name: '', email: '', phone: '' })
      }, 2500)
    } catch (err) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const gradient = `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] p-4 text-left"
        style={{ background: gradient }}
      >
        <div className="flex items-center gap-4">
          {link.icon && <span className="text-2xl flex-shrink-0">{link.icon}</span>}
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-lg text-white">{link.title}</h3>
            {link.description && (
              <p className="text-sm text-white/85 truncate">{link.description}</p>
            )}
          </div>
          <span className="text-white/70 flex-shrink-0">✉️</span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {link.icon && <span className="mr-2">{link.icon}</span>}
                {link.title}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                ×
              </button>
            </div>

            {link.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm">{link.description}</p>
            )}

            {success ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Enviado com sucesso!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Em breve entraremos em contato.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Seu e-mail *"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="WhatsApp (opcional)"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: gradient }}
                >
                  {loading ? 'Enviando...' : 'Quero receber! 🚀'}
                </button>

                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                  Seus dados estão seguros. Sem spam.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
