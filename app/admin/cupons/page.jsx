'use client'

import { useState, useEffect, useCallback } from 'react'

const TYPE_LABELS = { percent: '%', fixed: 'R$' }

export default function AdminCupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [alert, setAlert] = useState(null)

  const [form, setForm] = useState({
    code: '',
    discount: '',
    type: 'percent',
    maxUses: '',
    expiresAt: '',
    description: '',
  })

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/coupons')
    if (res.ok) {
      const data = await res.json()
      setCoupons(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  function showAlert(type, message) {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.code || !form.discount) {
      showAlert('error', 'Código e desconto são obrigatórios.')
      return
    }
    setCreating(true)
    const body = {
      code: form.code.toUpperCase().trim(),
      discount: parseFloat(form.discount),
      type: form.type,
      maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
      expiresAt: form.expiresAt || undefined,
      description: form.description || undefined,
    }
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      showAlert('success', `Cupom "${data.code}" criado com sucesso!`)
      setForm({ code: '', discount: '', type: 'percent', maxUses: '', expiresAt: '', description: '' })
      setShowForm(false)
      fetchCoupons()
    } else {
      showAlert('error', data.error || 'Erro ao criar cupom.')
    }
    setCreating(false)
  }

  async function handleDelete(id, code) {
    if (!confirm(`Deletar cupom "${code}"?`)) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showAlert('success', `Cupom "${code}" deletado.`)
      fetchCoupons()
    } else {
      showAlert('error', 'Erro ao deletar cupom.')
    }
    setDeletingId(null)
  }

  return (
    <div>
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="admin-page-title">Cupons</h1>
            <p className="admin-page-subtitle">Gerenciar cupons de desconto</p>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancelar' : '+ Novo Cupom'}
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`admin-alert admin-alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">Criar Novo Cupom</h2>
          </div>
          <div className="admin-card-body">
            <form onSubmit={handleCreate}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="admin-form-group">
                  <label className="admin-form-label">Código *</label>
                  <input
                    className="admin-input"
                    placeholder="ex: PROMO20"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Desconto *</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={form.type === 'percent' ? 'ex: 20 (%)' : 'ex: 10 (R$)'}
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Tipo</label>
                  <select
                    className="admin-input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="percent">Percentual (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Máx. de usos</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Expira em</label>
                  <input
                    className="admin-input"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Descrição</label>
                  <input
                    className="admin-input"
                    placeholder="Opcional"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={creating}
              >
                {creating ? 'Criando...' : 'Criar Cupom'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Coupons table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                border: '3px solid #f1f5f9',
                borderTopColor: '#7c3aed',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Desconto</th>
                <th>Tipo</th>
                <th>Usos</th>
                <th>Expira em</th>
                <th>Status</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date()
                const isFull = c.maxUses && c.usedCount >= c.maxUses
                const statusBadge = !c.isActive || isExpired || isFull ? 'red' : 'green'
                const statusLabel = !c.isActive ? 'Inativo' : isExpired ? 'Expirado' : isFull ? 'Esgotado' : 'Ativo'

                return (
                  <tr key={c.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: '700',
                          color: '#0f172a',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {c.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>
                      {c.type === 'percent'
                        ? `${c.discount}%`
                        : `R$ ${Number(c.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${c.type === 'percent' ? 'blue' : 'green'}`}>
                        {c.type === 'percent' ? 'Percentual' : 'Fixo'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {c.usedCount}
                      {c.maxUses ? ` / ${c.maxUses}` : ' / ∞'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleDateString('pt-BR')
                        : 'Sem expiração'}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${statusBadge}`}>{statusLabel}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {c.description || '—'}
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                        disabled={deletingId === c.id}
                        onClick={() => handleDelete(c.id, c.code)}
                      >
                        {deletingId === c.id ? '...' : 'Deletar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">
                      <div className="admin-empty-icon">🎟️</div>
                      <div className="admin-empty-text">Nenhum cupom cadastrado</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
