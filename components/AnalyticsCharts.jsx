'use client'

import { useEffect, useState } from 'react'

export default function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Erro ao buscar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Erro ao carregar analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'overview'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'links'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Links
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'time'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Tempo
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total de Cliques"
              value={analytics.totalClicks}
              icon="🖱️"
              color="purple"
            />
            <StatCard
              title="Total de Links"
              value={analytics.totalLinks}
              icon="🔗"
              color="blue"
            />
            <StatCard
              title="Links Ativos"
              value={analytics.totalActiveLinks}
              icon="✅"
              color="green"
            />
          </div>

          {/* Top Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Top Links
            </h3>
            {analytics.topLinks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Sem dados disponíveis
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.topLinks.map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {link.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {link.clicks} cliques
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {link.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links Tab */}
      {activeTab === 'links' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Cliques por Link
          </h3>
          {analytics.clicksByLink.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Sem links disponíveis
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.clicksByLink.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {link.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {link.clicks}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      clique{link.clicks !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Time Tab */}
      {activeTab === 'time' && (
        <div className="space-y-6">
          {/* Distribuição por Hora */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Últimas 24 Horas
            </h3>
            <div className="h-48 flex items-end gap-1">
              {analytics.clicksByHour.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div className="w-full bg-purple-100 dark:bg-purple-900 rounded-t relative group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition">
                    <div
                      className="bg-purple-600 dark:bg-purple-400 rounded-t transition-all"
                      style={{
                        height: `${Math.max((item.clicks / Math.max(...analytics.clicksByHour.map(i => i.clicks), 1)) * 100, 5)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 transform -rotate-45 origin-bottom-right">
                    {item.hour}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribuição por Dia */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Últimos 7 Dias
            </h3>
            <div className="h-48 flex items-end gap-2">
              {analytics.clicksByDay.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-t relative group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 rounded-t transition-all"
                      style={{
                        height: `${Math.max((item.clicks / Math.max(...analytics.clicksByDay.map(i => i.clicks), 1)) * 100, 5)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    purple: 'bg-purple-50 dark:bg-purple-900 border-purple-200 dark:border-purple-800',
    blue: 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800',
  }

  const textColorClasses = {
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-6`}>
      <div className="flex items-center gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${textColorClasses[color]}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
