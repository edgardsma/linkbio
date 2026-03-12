'use client'

import { useState, useEffect } from 'react'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_SHORT = ['D','S','T','Q','Q','S','S']

function formatPrice(cents) {
  if (!cents) return 'Gratuito'
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function BookingWidget({ link, themeColors }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1) // 1=serviço 2=data 3=horário 4=dados 5=confirmação
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [availability, setAvailability] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)
  const [userId, setUserId] = useState(null)

  // Extrair username do link.url (formato: @username ou username)
  const username = (link.url || '').replace('@', '').trim()

  useEffect(() => {
    if (!open || services.length > 0) return
    // Carregar serviços e disponibilidade
    Promise.all([
      fetch(`/api/agenda/services?username=${username}`).then(r => r.json()),
      fetch(`/api/agenda/availability?username=${username}`).then(r => r.json()),
    ]).then(([svcData, availData]) => {
      setServices(svcData.services || [])
      setUserId(svcData.userId)
      setAvailability((availData.availability || []).filter(a => a.isActive).map(a => a.dayOfWeek))
    }).catch(console.error)
  }, [open, username])

  useEffect(() => {
    if (!selectedDate || !selectedService || !userId) return
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot(null)
    fetch(`/api/agenda/slots?userId=${userId}&serviceId=${selectedService.id}&date=${toDateStr(selectedDate)}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots || []))
      .catch(console.error)
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, selectedService, userId])

  function isDateAvailable(date) {
    if (date < new Date(new Date().setHours(0,0,0,0))) return false
    return availability.includes(date.getDay())
  }

  function getDaysInMonth(year, month) {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  async function submitBooking(e) {
    e.preventDefault()
    if (!form.name || !form.email) { setError('Nome e e-mail são obrigatórios'); return }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          serviceId: selectedService.id,
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone,
          date: toDateStr(selectedDate),
          startTime: selectedSlot.startTime,
          notes: form.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBooking(data.booking)
      setStep(5)
    } catch (e) {
      setError(e.message || 'Erro ao confirmar agendamento')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep(1); setSelectedService(null); setSelectedDate(null)
    setSelectedSlot(null); setForm({ name: '', email: '', phone: '', notes: '' })
    setBooking(null); setError('')
  }

  const gradient = `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`
  const { year, month } = { year: currentMonth.getFullYear(), month: currentMonth.getMonth() }
  const { firstDay, daysInMonth } = getDaysInMonth(year, month)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] p-4 text-left"
        style={{ background: gradient }}
      >
        <div className="flex items-center gap-4">
          {link.icon && <span className="text-2xl flex-shrink-0">{link.icon}</span>}
          <div className="flex-grow">
            <h3 className="font-semibold text-lg text-white">{link.title || 'Agendar sessão'}</h3>
            {link.description && <p className="text-sm text-white/85 truncate">{link.description}</p>}
          </div>
          <span className="text-white/70">📅</span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                {step > 1 && step < 5 && (
                  <button onClick={() => setStep(s => s - 1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    ←
                  </button>
                )}
                <h2 className="font-bold text-gray-900 dark:text-white">
                  {step === 1 && '📋 Escolha o serviço'}
                  {step === 2 && '📅 Escolha a data'}
                  {step === 3 && '🕐 Escolha o horário'}
                  {step === 4 && '✍️ Seus dados'}
                  {step === 5 && '✅ Confirmado!'}
                </h2>
              </div>
              <button
                onClick={() => { setOpen(false); reset() }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xl"
              >×</button>
            </div>

            <div className="p-5">
              {/* Step 1: Serviços */}
              {step === 1 && (
                <div className="space-y-3">
                  {services.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-6">Nenhum serviço disponível</p>
                  ) : (
                    services.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => { setSelectedService(svc); setStep(2) }}
                        className="w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: svc.color }} />
                          <div className="flex-grow">
                            <p className="font-semibold text-gray-900 dark:text-white">{svc.title}</p>
                            {svc.description && <p className="text-sm text-gray-500 dark:text-gray-400">{svc.description}</p>}
                            <div className="flex gap-3 mt-1 text-xs text-gray-400">
                              <span>⏱ {svc.duration} min</span>
                              <span className="font-medium text-gray-600 dark:text-gray-300">{formatPrice(svc.price)}</span>
                            </div>
                          </div>
                          <span className="text-gray-400">→</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Step 2: Calendário */}
              {step === 2 && (
                <div>
                  {/* Serviço selecionado */}
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedService?.color }} />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{selectedService?.title}</span>
                    <span className="text-xs text-purple-500 dark:text-purple-400 ml-auto">⏱ {selectedService?.duration} min</span>
                  </div>

                  {/* Navegação de mês */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                    >←</button>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {MONTHS[month]} {year}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                    >→</button>
                  </div>

                  {/* Grid de dias */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS_SHORT.map((d, i) => (
                      <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const date = new Date(year, month, i + 1)
                      const available = isDateAvailable(date)
                      const selected = selectedDate && isSameDay(date, selectedDate)
                      return (
                        <button
                          key={i}
                          disabled={!available}
                          onClick={() => { setSelectedDate(date); setStep(3) }}
                          className={`aspect-square rounded-lg text-sm font-medium transition ${
                            selected
                              ? 'bg-purple-600 text-white'
                              : available
                              ? 'hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-900 dark:text-white cursor-pointer'
                              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Horários */}
              {step === 3 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    📅 {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </p>
                  {loadingSlots ? (
                    <p className="text-center text-gray-400 py-6">Carregando horários...</p>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400">Sem horários disponíveis neste dia.</p>
                      <button onClick={() => setStep(2)} className="mt-3 text-purple-600 dark:text-purple-400 text-sm hover:underline">
                        Escolher outra data
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot, i) => (
                        <button
                          key={i}
                          onClick={() => { setSelectedSlot(slot); setStep(4) }}
                          className="py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Dados */}
              {step === 4 && (
                <form onSubmit={submitBooking} className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm space-y-1">
                    <p><span className="text-gray-500">Serviço:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedService?.title}</span></p>
                    <p><span className="text-gray-500">Data:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedDate?.toLocaleDateString('pt-BR')}</span></p>
                    <p><span className="text-gray-500">Horário:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedSlot?.startTime} – {selectedSlot?.endTime}</span></p>
                    <p><span className="text-gray-500">Valor:</span> <span className="font-medium text-green-600 dark:text-green-400">{formatPrice(selectedService?.price)}</span></p>
                  </div>

                  <input
                    required
                    placeholder="Seu nome *"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Seu e-mail *"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp (opcional)"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <textarea
                    placeholder="Observações (opcional)"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />

                  {error && (
                    <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: gradient }}
                  >
                    {submitting ? 'Confirmando...' : selectedService?.price ? `Confirmar e Pagar ${formatPrice(selectedService.price)}` : '✅ Confirmar Agendamento'}
                  </button>
                </form>
              )}

              {/* Step 5: Confirmação */}
              {step === 5 && booking && (
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Agendamento Confirmado!</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                    Você receberá um e-mail de confirmação em breve.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left space-y-2 text-sm mb-5">
                    <p><span className="text-gray-500">Serviço:</span> <span className="font-medium text-gray-900 dark:text-white">{booking.service?.title}</span></p>
                    <p><span className="text-gray-500">Data:</span> <span className="font-medium text-gray-900 dark:text-white">{new Date(booking.date).toLocaleDateString('pt-BR')}</span></p>
                    <p><span className="text-gray-500">Horário:</span> <span className="font-medium text-gray-900 dark:text-white">{booking.startTime} – {booking.endTime}</span></p>
                  </div>
                  <button
                    onClick={() => { setOpen(false); reset() }}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{ background: gradient }}
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
