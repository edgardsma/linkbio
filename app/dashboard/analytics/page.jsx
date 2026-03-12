'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function StatCard({ label, value, icon, sub, color = 'purple' }) {
  const colors = {
    purple: 'from-purple-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    orange: 'from-orange-500 to-red-500',
  }
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 bg-gradient-to-br ${colors[color]}`} />
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    fetch(`/api/analytics?period=${period}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session, period])

  if (status === 'loading' || !session) return null

  const clicks = data?.clicks || []
  const links = data?.topLinks || []
  const totalClicks = data?.totalClicks || 0
  const uniqueLinks = data?.uniqueLinks || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Performance dos seus links</p>
          </div>
          <div className="flex gap-2">
            {[
              { v: '24h', l: '24h' },
              { v: '7d', l: '7 dias' },
              { v: '30d', l: '30 dias' },
              { v: '90d', l: '90 dias' },
            ].map(p => (
              <button
                key={p.v}
                onClick={() => setPeriod(p.v)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                  period === p.v
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                {p.l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando dados...</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total de cliques" value={totalClicks.toLocaleString('pt-BR')} icon="👆" color="purple" />
              <StatCard label="Links ativos" value={uniqueLinks} icon="🔗" color="blue" />
              <StatCard
                label="Melhor link"
                value={links[0]?.clicks || 0}
                icon="🏆"
                sub={links[0]?.title ? `"${links[0].title}"` : ''}
                color="orange"
              />
              <StatCard
                label="Leads capturados"
                value={data?.totalLeads || 0}
                icon="👥"
                color="green"
              />
            </div>

            {/* Top Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4">🏆 Top Links</h2>
                {links.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">Nenhum clique ainda</p>
                ) : (
                  <div className="space-y-3">
                    {links.slice(0, 10).map((link, i) => (
                      <div key={link.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{link.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                              <div
                                className="bg-purple-600 h-1.5 rounded-full"
                                style={{ width: `${links[0]?.clicks ? (link.clicks / links[0].clicks) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
                          {link.clicks}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity chart placeholder */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4">📈 Cliques por dia</h2>
                {clicks.length === 0 ? (
                  <div className="flex items-end justify-center gap-1 h-32">
                    <p className="text-gray-400 text-sm">Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="flex items-end justify-between gap-1 h-32">
                    {clicks.slice(-14).map((day, i) => {
                      const maxVal = Math.max(...clicks.slice(-14).map(d => d.count), 1)
                      const pct = (day.count / maxVal) * 100
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 gap-1" title={`${day.date}: ${day.count} cliques`}>
                          <div className="w-full bg-purple-200 dark:bg-purple-900/40 rounded-t" style={{ height: `${Math.max(pct, 2)}%` }} />
                          {i % 3 === 0 && (
                            <span className="text-[10px] text-gray-400 rotate-45 origin-left">{day.date?.slice(5)}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Export button */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <a
                    href="/api/analytics/export?format=csv"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    📥 Exportar relatório CSV
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
