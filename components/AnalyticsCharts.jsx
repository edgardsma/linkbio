'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function countryFlag(code) {
  if (!code || code.length !== 2 || code === 'De') return '🌍'
  try {
    const OFFSET = 0x1f1e6 - 65
    return String.fromCodePoint(
      code.toUpperCase().charCodeAt(0) + OFFSET,
      code.toUpperCase().charCodeAt(1) + OFFSET
    )
  } catch {
    return '🌍'
  }
}

const COUNTRY_NAMES = {
  BR: 'Brasil', US: 'Estados Unidos', PT: 'Portugal', AR: 'Argentina',
  MX: 'México', CO: 'Colômbia', CL: 'Chile', PE: 'Peru', UY: 'Uruguai',
  PY: 'Paraguai', GB: 'Reino Unido', DE: 'Alemanha', FR: 'França',
  ES: 'Espanha', IT: 'Itália', JP: 'Japão', CN: 'China', IN: 'Índia',
  CA: 'Canadá', AU: 'Austrália', Desconhecido: 'Desconhecido',
}

function countryName(code) {
  return COUNTRY_NAMES[code] || code
}

// ─── SVG Line Chart ──────────────────────────────────────────────────────────

function LineChart({ data }) {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        Sem dados para o período selecionado
      </div>
    )
  }

  const W = 600
  const H = 180
  const padL = 44
  const padR = 16
  const padT = 16
  const padB = 36
  const cW = W - padL - padR
  const cH = H - padT - padB

  const { maxV, n, pts, lineD, areaD, yTicks, labelStep, xOf, yOf } = useMemo(() => {
    const maxV = Math.max(...data.map((d) => d.clicks), 1)
    const n = data.length
    const xOf = (i) => padL + (n <= 1 ? cW / 2 : (i / (n - 1)) * cW)
    const yOf = (v) => padT + (1 - v / maxV) * cH
    const pts = data.map((d, i) => [xOf(i), yOf(d.clicks)])
    const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    const areaD =
      `M${padL},${padT + cH} ` +
      pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') +
      ` L${W - padR},${padT + cH} Z`
    const yTicks = [0, Math.ceil(maxV / 2), maxV]
    const labelStep = Math.ceil(n / 7)
    return { maxV, n, pts, lineD, areaD, yTicks, labelStep, xOf, yOf }
  }, [data, cW, cH, padL, padR, padT])

  const handleMouseMove = (e) => {
    const svgEl = e.currentTarget
    const rect = svgEl.getBoundingClientRect()
    const scaleX = W / rect.width
    const svgX = (e.clientX - rect.left) * scaleX
    const dataX = svgX - padL
    const idx = Math.round((dataX / cW) * (n - 1))
    setHovered(Math.max(0, Math.min(n - 1, idx)))
  }

  const hp = hovered !== null ? pts[hovered] : null

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: '192px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <defs>
        <linearGradient id="lgLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="lgArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)}
            stroke="#e5e7eb" strokeWidth="1"
            strokeDasharray={v === 0 ? undefined : '4,3'}
          />
          <text x={padL - 6} y={yOf(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
            {v}
          </text>
        </g>
      ))}

      {/* Area */}
      <path d={areaD} fill="url(#lgArea)" />

      {/* Line */}
      <path d={lineD} fill="none" stroke="url(#lgLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* X labels */}
      {data.map((d, i) => {
        if (i % labelStep !== 0 && i !== n - 1) return null
        return (
          <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {d.date.slice(5).replace('-', '/')}
          </text>
        )
      })}

      {/* Hover overlay */}
      <rect x={padL} y={padT} width={cW} height={cH} fill="transparent" style={{ cursor: 'crosshair' }} />

      {/* Tooltip */}
      {hp && hovered !== null && (
        <g>
          <line
            x1={hp[0]} y1={padT} x2={hp[0]} y2={padT + cH}
            stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4,3" opacity="0.6"
          />
          <circle cx={hp[0]} cy={hp[1]} r="5" fill="#8b5cf6" stroke="white" strokeWidth="2" />
          {(() => {
            const tx = Math.min(Math.max(hp[0] - 44, 4), W - 92)
            const ty = Math.max(hp[1] - 52, 4)
            return (
              <g>
                <rect x={tx} y={ty} width="88" height="38" rx="6" fill="#1f2937" opacity="0.92" />
                <text x={tx + 44} y={ty + 14} textAnchor="middle" fontSize="9" fill="#d1d5db">
                  {data[hovered].date.slice(5).replace('-', '/')}
                </text>
                <text x={tx + 44} y={ty + 29} textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">
                  {data[hovered].clicks} clique{data[hovered].clicks !== 1 ? 's' : ''}
                </text>
              </g>
            )
          })()}
        </g>
      )}
    </svg>
  )
}

// ─── Horizontal Bar ──────────────────────────────────────────────────────────

function HorizontalBar({ label, value, maxValue, color = 'purple', sublabel }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  const colors = {
    purple: 'from-purple-500 to-purple-400',
    blue: 'from-blue-500 to-blue-400',
    green: 'from-emerald-500 to-emerald-400',
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-1 gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{label}</span>
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
          {sublabel && (
            <span className="text-xs text-gray-400 ml-1">{sublabel}</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors[color] || colors.purple} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  )
}

// ─── Device Donut (conic-gradient) ───────────────────────────────────────────

function DeviceDonut({ devices, browsers }) {
  const total = (devices?.mobile || 0) + (devices?.desktop || 0) + (devices?.tablet || 0)

  if (!total) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">Sem dados de dispositivos</div>
    )
  }

  const mp = ((devices.mobile || 0) / total) * 100
  const dp = ((devices.desktop || 0) / total) * 100
  const tp = ((devices.tablet || 0) / total) * 100

  const gradient = `conic-gradient(
    #8b5cf6 0% ${mp}%,
    #3b82f6 ${mp}% ${mp + dp}%,
    #10b981 ${mp + dp}% 100%
  )`

  const segments = [
    { label: 'Mobile', value: devices.mobile || 0, pct: Math.round(mp), color: '#8b5cf6', icon: '📱' },
    { label: 'Desktop', value: devices.desktop || 0, pct: Math.round(dp), color: '#3b82f6', icon: '💻' },
    { label: 'Tablet', value: devices.tablet || 0, pct: Math.round(tp), color: '#10b981', icon: '📟' },
  ].filter((s) => s.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8 flex-wrap">
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-full" style={{ background: gradient }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{total}</span>
              <span className="text-[9px] text-gray-400">cliques</span>
            </div>
          </div>
        </div>
        <div className="space-y-3 flex-1">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{s.icon} {s.label}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</span>
              <span className="text-xs text-gray-400 w-8 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {browsers && browsers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Navegadores</h4>
          <div className="space-y-2.5">
            {browsers.map((b) => (
              <HorizontalBar
                key={b.browser}
                label={b.browser}
                value={b.clicks}
                maxValue={browsers[0]?.clicks || 1}
                sublabel={`${b.percentage}%`}
                color="blue"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Period Selector ─────────────────────────────────────────────────────────

function PeriodSelector({ period, customFrom, customTo, onChange, onCustomChange }) {
  const options = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: 'all', label: 'Tudo' },
    { value: 'custom', label: 'Personalizado' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            period === o.value
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {o.label}
        </button>
      ))}

      {period === 'custom' && (
        <div className="flex items-center gap-2 mt-2 w-full sm:w-auto sm:mt-0">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomChange('from', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          />
          <span className="text-gray-400 text-sm">até</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomChange('to', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          />
        </div>
      )}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color, sub }) {
  const styles = {
    purple: {
      wrap: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
    },
    blue: {
      wrap: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      wrap: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    orange: {
      wrap: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      text: 'text-orange-600 dark:text-orange-400',
    },
  }
  const s = styles[color] || styles.purple

  return (
    <div className={`${s.wrap} border rounded-xl p-5`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{title}</p>
          <p className={`text-2xl font-bold ${s.text}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [exportLoading, setExportLoading] = useState(false)

  const buildUrl = useCallback(
    (base) => {
      if (period === 'custom' && customFrom && customTo) {
        return `${base}?from=${customFrom}&to=${customTo}`
      }
      return `${base}?period=${period}`
    },
    [period, customFrom, customTo]
  )

  const fetchAnalytics = useCallback(async () => {
    if (period === 'custom' && (!customFrom || !customTo)) return
    setLoading(true)
    try {
      const res = await fetch(buildUrl('/api/analytics'))
      if (res.ok) setAnalytics(await res.json())
    } catch (e) {
      console.error('Erro ao buscar analytics:', e)
    } finally {
      setLoading(false)
    }
  }, [buildUrl, period, customFrom, customTo])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExport = async (format = 'csv') => {
    setExportLoading(true)
    try {
      const url = buildUrl('/api/analytics/export') + `&format=${format}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erro na exportação')

      if (format === 'csv') {
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(a.href)
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(a.href)
      }
    } catch (e) {
      console.error('Erro ao exportar:', e)
    } finally {
      setExportLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'links', label: 'Links' },
    { id: 'time', label: 'Tempo' },
    { id: 'geo', label: 'Geografia' },
    { id: 'devices', label: 'Dispositivos' },
  ]

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-3">📊</p>
        <p>Erro ao carregar analytics. Tente novamente.</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const { summary, topLinks, allLinks, clicksByDay, geo, devices, browsers } = analytics

  return (
    <div className="space-y-5">
      {/* Header: período + exportar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PeriodSelector
          period={period}
          customFrom={customFrom}
          customTo={customTo}
          onChange={(p) => setPeriod(p)}
          onCustomChange={(field, val) =>
            field === 'from' ? setCustomFrom(val) : setCustomTo(val)
          }
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exportLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            <span>⬇️</span> CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exportLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            <span>⬇️</span> JSON
          </button>
        </div>
      </div>

      {/* Período exibido */}
      {summary && (
        <p className="text-xs text-gray-400">
          Dados de{' '}
          <span className="font-medium text-gray-500 dark:text-gray-300">
            {summary.from.split('-').reverse().join('/')}
          </span>{' '}
          até{' '}
          <span className="font-medium text-gray-500 dark:text-gray-300">
            {summary.to.split('-').reverse().join('/')}
          </span>
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
              activeTab === t.id
                ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Visão Geral ─────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Cliques no período"
              value={summary.totalClicks.toLocaleString('pt-BR')}
              icon="🖱️"
              color="purple"
            />
            <StatCard
              title="Links ativos"
              value={summary.totalLinks}
              icon="🔗"
              color="blue"
            />
            <StatCard
              title="Média por link"
              value={summary.averageClicksPerLink}
              icon="📊"
              color="green"
            />
            <StatCard
              title="País principal"
              value={geo?.[0] ? countryFlag(geo[0].country) + ' ' + (COUNTRY_NAMES[geo[0].country] || geo[0].country) : '—'}
              icon="🌎"
              color="orange"
              sub={geo?.[0] ? `${geo[0].percentage}% dos cliques` : undefined}
            />
          </div>

          {/* Gráfico resumido */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Cliques ao longo do tempo
            </h3>
            <LineChart data={clicksByDay} />
          </div>

          {/* Top Links resumo */}
          {topLinks && topLinks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                Top 5 Links
              </h3>
              <div className="space-y-3">
                {topLinks.map((link) => (
                  <HorizontalBar
                    key={link.id}
                    label={link.icon ? `${link.icon} ${link.title}` : link.title}
                    value={link.clicks}
                    maxValue={topLinks[0]?.clicks || 1}
                    sublabel="cliques"
                    color="purple"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Links ──────────────────────────────── */}
      {activeTab === 'links' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Todos os Links ({allLinks?.length || 0})
            </h3>
          </div>

          {!allLinks || allLinks.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Nenhum link encontrado</p>
          ) : (
            <div className="space-y-3">
              {allLinks.map((link, idx) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex-shrink-0 w-6 text-xs text-gray-400 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <HorizontalBar
                      label={link.icon ? `${link.icon} ${link.title}` : link.title}
                      value={link.clicks}
                      maxValue={allLinks[0]?.clicks || 1}
                      sublabel="cliques"
                      color={idx < 3 ? 'purple' : 'blue'}
                    />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-purple-500 truncate block mt-1"
                    >
                      {link.url}
                    </a>
                  </div>
                  {!link.isActive && (
                    <span className="flex-shrink-0 text-xs bg-gray-100 dark:bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                      Inativo
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Tempo ──────────────────────────────── */}
      {activeTab === 'time' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Cliques por dia
            </h3>
            <span className="text-xs text-gray-400">
              Total: <strong className="text-purple-500">{summary.totalClicks}</strong>
            </span>
          </div>
          <LineChart data={clicksByDay} />

          {/* Mini tabela dos dias com mais cliques */}
          {clicksByDay && clicksByDay.filter((d) => d.clicks > 0).length > 0 && (
            <div className="mt-5 border-t border-gray-100 dark:border-gray-700 pt-4">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Dias com mais cliques
              </h4>
              <div className="space-y-2">
                {[...clicksByDay]
                  .filter((d) => d.clicks > 0)
                  .sort((a, b) => b.clicks - a.clicks)
                  .slice(0, 5)
                  .map((d) => (
                    <div key={d.date} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {d.clicks} clique{d.clicks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Geografia ──────────────────────────── */}
      {activeTab === 'geo' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Países com mais cliques
            </h3>
            <span className="text-xs text-gray-400 bg-blue-50 dark:bg-blue-900/30 text-blue-500 px-2 py-0.5 rounded">
              Via Vercel Edge
            </span>
          </div>

          {!geo || geo.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">🌍</p>
              <p className="text-sm text-gray-400">
                Dados de geolocalização disponíveis apenas em produção (Vercel).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {geo.map((g, i) => (
                <div key={g.country}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xl w-8 text-center">{countryFlag(g.country)}</span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                      {countryName(g.country)}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {g.clicks.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-gray-400 w-10 text-right">{g.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ml-11">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${g.percentage}%`,
                        background: i === 0 ? '#8b5cf6' : i === 1 ? '#3b82f6' : '#10b981',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!geo?.length && (
            <p className="mt-4 text-xs text-gray-400 text-center">
              💡 Os dados de país são capturados automaticamente ao fazer deploy na Vercel.
            </p>
          )}
        </div>
      )}

      {/* ── Tab: Dispositivos ───────────────────────── */}
      {activeTab === 'devices' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-5">
            Dispositivos e Navegadores
          </h3>
          <DeviceDonut devices={devices} browsers={browsers} />
        </div>
      )}
    </div>
  )
}
