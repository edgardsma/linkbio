'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAYS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}
const STATUS_LABELS = { pending: 'Pendente', confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Concluído' }

function formatPrice(cents) {
  if (!cents) return 'Gratuito'
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

function AgendaContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState('servicos')

  // Serviços
  const [services, setServices] = useState([])
  const [serviceForm, setServiceForm] = useState({
    title: '', description: '', duration: 60, price: 0, color: '#667eea', maxPerDay: 10,
  })
  const [editingService, setEditingService] = useState(null)
  const [savingService, setSavingService] = useState(false)

  // Disponibilidade
  const [availability, setAvailability] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: '09:00',
      endTime: '18:00',
      isActive: i >= 1 && i <= 5, // Seg-Sex ativos por padrão
    }))
  )
  const [savingAvail, setSavingAvail] = useState(false)

  // Bookings
  const [bookings, setBookings] = useState([])
  const [bookingFilter, setBookingFilter] = useState('')
  const [loadingBookings, setLoadingBookings] = useState(true)

  // Google Calendar
  const [gcConnected, setGcConnected] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    loadAll()

    // Verificar retorno do OAuth
    const gc = searchParams.get('gcalendar')
    if (gc === 'connected') setGcConnected(true)
  }, [session])

  async function loadAll() {
    const [svcRes, availRes, bookRes, gcRes] = await Promise.all([
      fetch('/api/agenda/services'),
      fetch('/api/agenda/availability'),
      fetch('/api/bookings'),
      fetch('/api/integrations/gcalendar'),
    ])

    if (svcRes.ok) setServices((await svcRes.json()).services || [])
    if (availRes.ok) {
      const data = await availRes.json()
      if (data.availability?.length) {
        setAvailability(prev => {
          const next = [...prev]
          data.availability.forEach(a => {
            next[a.dayOfWeek] = { dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime, isActive: a.isActive }
          })
          return next
        })
      }
    }
    if (bookRes.ok) setBookings((await bookRes.json()).bookings || [])
    if (gcRes.ok) setGcConnected((await gcRes.json()).connected)
    setLoadingBookings(false)
  }

  async function saveService(e) {
    e.preventDefault()
    setSavingService(true)
    try {
      const url = editingService ? `/api/agenda/services/${editingService}` : '/api/agenda/services'
      const method = editingService ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (editingService) {
        setServices(s => s.map(x => x.id === editingService ? data.service : x))
      } else {
        setServices(s => [...s, data.service])
      }
      setServiceForm({ title: '', description: '', duration: 60, price: 0, color: '#667eea', maxPerDay: 10 })
      setEditingService(null)
    } catch {
      alert('Erro ao salvar serviço')
    } finally {
      setSavingService(false)
    }
  }

  async function deleteService(id) {
    if (!confirm('Excluir este serviço?')) return
    await fetch(`/api/agenda/services/${id}`, { method: 'DELETE' })
    setServices(s => s.filter(x => x.id !== id))
  }

  async function saveAvailability() {
    setSavingAvail(true)
    try {
      const res = await fetch('/api/agenda/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      })
      if (!res.ok) throw new Error()
      alert('Disponibilidade salva!')
    } catch {
      alert('Erro ao salvar disponibilidade')
    } finally {
      setSavingAvail(false)
    }
  }

  async function updateBookingStatus(id, newStatus) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const data = await res.json()
      setBookings(b => b.map(x => x.id === id ? data.booking : x))
    }
  }

  async function connectGoogleCalendar() {
    const res = await fetch('/api/integrations/gcalendar?action=connect')
    const { url } = await res.json()
    window.location.href = url
  }

  async function disconnectGoogleCalendar() {
    await fetch('/api/integrations/gcalendar', { method: 'DELETE' })
    setGcConnected(false)
  }

  const filteredBookings = bookings.filter(b =>
    !bookingFilter || b.status === bookingFilter
  )

  if (status === 'loading' || !session) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Agenda</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure seus serviços e disponibilidade</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: 'servicos', label: '🛠️ Serviços' },
            { id: 'disponibilidade', label: '🕐 Disponibilidade' },
            { id: 'agendamentos', label: `📋 Agendamentos${bookings.length ? ` (${bookings.length})` : ''}` },
            { id: 'integracoes', label: '🔗 Integrações' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ====== SERVIÇOS ====== */}
        {tab === 'servicos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-5">
                {editingService ? '✏️ Editar Serviço' : '➕ Novo Serviço'}
              </h2>
              <form onSubmit={saveService} className="space-y-4">
                <input
                  required
                  placeholder="Nome do serviço *"
                  value={serviceForm.title}
                  onChange={e => setServiceForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={serviceForm.description}
                  onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Duração (min) *</label>
                    <select
                      value={serviceForm.duration}
                      onChange={e => setServiceForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0 = gratuito"
                      value={serviceForm.price / 100 || ''}
                      onChange={e => setServiceForm(f => ({ ...f, price: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cor</label>
                    <input
                      type="color"
                      value={serviceForm.color}
                      onChange={e => setServiceForm(f => ({ ...f, color: e.target.value }))}
                      className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Máx/dia</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={serviceForm.maxPerDay}
                      onChange={e => setServiceForm(f => ({ ...f, maxPerDay: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingService}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {savingService ? 'Salvando...' : editingService ? 'Atualizar' : 'Criar Serviço'}
                  </button>
                  {editingService && (
                    <button
                      type="button"
                      onClick={() => { setEditingService(null); setServiceForm({ title: '', description: '', duration: 60, price: 0, color: '#667eea', maxPerDay: 10 }) }}
                      className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Lista */}
            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
                  <p className="text-4xl mb-3">🛠️</p>
                  <p className="text-gray-500 dark:text-gray-400">Crie seu primeiro serviço para começar a receber agendamentos.</p>
                </div>
              ) : (
                services.map(svc => (
                  <div key={svc.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ background: svc.color }} />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{svc.title}</h3>
                          {!svc.isActive && <span className="text-xs text-gray-400">(inativo)</span>}
                        </div>
                        {svc.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{svc.description}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>⏱ {svc.duration} min</span>
                          <span>💰 {formatPrice(svc.price)}</span>
                          <span>📅 máx {svc.maxPerDay}/dia</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingService(svc.id); setServiceForm({ title: svc.title, description: svc.description || '', duration: svc.duration, price: svc.price, color: svc.color, maxPerDay: svc.maxPerDay }) }}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm"
                        >✏️</button>
                        <button
                          onClick={() => deleteService(svc.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm"
                        >🗑️</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ====== DISPONIBILIDADE ====== */}
        {tab === 'disponibilidade' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-6">Horários de Atendimento</h2>
            <div className="space-y-3 mb-6">
              {availability.map((day, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition ${
                  day.isActive
                    ? 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10'
                    : 'border-gray-200 dark:border-gray-700 opacity-60'
                }`}>
                  <div className="flex items-center gap-3 w-28 flex-shrink-0">
                    <button
                      onClick={() => setAvailability(a => a.map((d, j) => j === i ? { ...d, isActive: !d.isActive } : d))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${day.isActive ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${day.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{DAYS_FULL[i]}</span>
                  </div>
                  {day.isActive && (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={e => setAvailability(a => a.map((d, j) => j === i ? { ...d, startTime: e.target.value } : d))}
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-gray-400">até</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={e => setAvailability(a => a.map((d, j) => j === i ? { ...d, endTime: e.target.value } : d))}
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={saveAvailability}
              disabled={savingAvail}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {savingAvail ? 'Salvando...' : '💾 Salvar Disponibilidade'}
            </button>
          </div>
        )}

        {/* ====== AGENDAMENTOS ====== */}
        {tab === 'agendamentos' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-2 flex-wrap">
              {[['', 'Todos'], ['pending', 'Pendentes'], ['confirmed', 'Confirmados'], ['completed', 'Concluídos'], ['cancelled', 'Cancelados']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setBookingFilter(v)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${bookingFilter === v ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {loadingBookings ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredBookings.map(b => (
                  <div key={b.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                            {STATUS_LABELS[b.status]}
                          </span>
                          {b.service && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{b.service.title}</span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">{b.guestName}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>📅 {new Date(b.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                          <span>🕐 {b.startTime} – {b.endTime}</span>
                          <a href={`mailto:${b.guestEmail}`} className="hover:text-purple-600 dark:hover:text-purple-400">✉️ {b.guestEmail}</a>
                          {b.guestPhone && (
                            <a href={`https://wa.me/55${b.guestPhone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                              💬 {b.guestPhone}
                            </a>
                          )}
                        </div>
                        {b.notes && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">"{b.notes}"</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'confirmed')}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                          >
                            ✓ Confirmar
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'completed')}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                          >
                            ✓ Concluir
                          </button>
                        )}
                        {['pending', 'confirmed'].includes(b.status) && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'cancelled')}
                            className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== INTEGRAÇÕES ====== */}
        {tab === 'integracoes' && (
          <div className="space-y-4">
            {/* Google Calendar */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow flex items-center justify-center text-2xl border border-gray-100">📅</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Google Calendar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cria eventos automaticamente após confirmação
                    </p>
                    {gcConnected && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                        ✅ Conectado
                      </span>
                    )}
                  </div>
                </div>
                {gcConnected ? (
                  <button
                    onClick={disconnectGoogleCalendar}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={connectGoogleCalendar}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
                  >
                    Conectar
                  </button>
                )}
              </div>
            </div>

            {/* Link de agendamento */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">🔗 Widget de Agendamento no Perfil</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Adicione um link do tipo <strong>"Agendamento"</strong> ao seu perfil para que visitantes possam marcar sessões diretamente.
              </p>
              <a
                href="/dashboard/links"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
              >
                ➕ Adicionar link de Agendamento
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AgendaPage() {
  return (
    <Suspense>
      <AgendaContent />
    </Suspense>
  )
}
