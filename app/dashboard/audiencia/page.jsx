'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function exportCSV(leads) {
  const header = 'Nome,E-mail,WhatsApp,Origem,Data\n'
  const rows = leads.map(l =>
    `"${l.name || ''}","${l.email}","${l.phone || ''}","${l.link?.title || 'Direto'}","${new Date(l.createdAt).toLocaleDateString('pt-BR')}"`
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AudienciaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    fetch(`/api/leads?page=${page}&limit=20`)
      .then(r => r.json())
      .then(data => {
        setLeads(data.leads || [])
        setTotal(data.total || 0)
        setPages(data.pages || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session, page])

  const filtered = leads.filter(l =>
    !search || l.email.includes(search.toLowerCase()) || (l.name || '').toLowerCase().includes(search.toLowerCase())
  )

  if (status === 'loading') return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audiência</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {total} contato{total !== 1 ? 's' : ''} capturado{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportCSV(leads)}
              disabled={leads.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: total, icon: '👥' },
            { label: 'Esta semana', value: leads.filter(l => new Date(l.createdAt) > new Date(Date.now() - 7 * 86400000)).length, icon: '📅' },
            { label: 'Com WhatsApp', value: leads.filter(l => l.phone).length, icon: '💬' },
            { label: 'Fontes únicas', value: new Set(leads.map(l => l.link?.title || 'Direto')).size, icon: '🔗' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-80 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 dark:text-gray-400">
                {total === 0
                  ? 'Nenhum lead capturado ainda. Adicione um link tipo "Formulário de Leads" ao seu perfil!'
                  : 'Nenhum resultado para esta busca.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filtered.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {lead.name || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <a href={`mailto:${lead.email}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {lead.phone ? (
                          <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                            {lead.phone}
                          </a>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          {lead.link?.title || 'Direto'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Página {page} de {pages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
