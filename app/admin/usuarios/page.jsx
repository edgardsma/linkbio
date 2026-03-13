'use client'

import { useState, useEffect, useCallback } from 'react'

const ROLES = ['user', 'admin', 'agency']

const ROLE_BADGE = {
  admin:  'red',
  agency: 'blue',
  user:   'gray',
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true)
      const params = new URLSearchParams({ page, limit: 20 })
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
      setLoading(false)
    },
    [search, roleFilter]
  )

  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  async function updateRole(userId, newRole) {
    setUpdatingId(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    }
    setUpdatingId(null)
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Usuários</h1>
        <p className="admin-page-subtitle">{pagination.total} usuários cadastrados</p>
      </div>

      {/* Filters */}
      <div
        className="admin-card"
        style={{
          marginBottom: '1.5rem',
          padding: '1rem 1.5rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Buscar por nome, email ou username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
          className="admin-input"
          style={{ flex: '1', minWidth: '200px' }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-input"
          style={{ width: 'auto' }}
        >
          <option value="">Todos os roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button className="admin-btn admin-btn-primary" onClick={() => fetchUsers(1)}>
          Buscar
        </button>
      </div>

      {/* Table */}
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
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Links</th>
                  <th>Plano</th>
                  <th>Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            style={{
                              width: '2rem',
                              height: '2rem',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '2rem',
                              height: '2rem',
                              borderRadius: '50%',
                              background: '#f3e8ff',
                              color: '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              flexShrink: 0,
                            }}
                          >
                            {(user.name || user.email)[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '500', color: '#0f172a' }}>{user.name || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>@{user.username || '—'}</td>
                    <td>
                      <span className={`admin-badge admin-badge-${ROLE_BADGE[user.role] || 'gray'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{user._count?.links ?? 0}</td>
                    <td>
                      <span
                        className={`admin-badge admin-badge-${
                          user.subscription?.status === 'active' ? 'purple' : 'gray'
                        }`}
                      >
                        {user.subscription?.plan || 'FREE'}
                      </span>
                      {user.subscription?.status === 'active' && (
                        <span
                          className="admin-badge admin-badge-green"
                          style={{ marginLeft: '0.25rem' }}
                        >
                          ativo
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="admin-input"
                        style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">👥</div>
                        <div className="admin-empty-text">Nenhum usuário encontrado</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="admin-pagination">
                <span>
                  Página {pagination.page} de {pagination.pages} ({pagination.total} usuários)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="admin-btn admin-btn-ghost"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchUsers(pagination.page - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    className="admin-btn admin-btn-ghost"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchUsers(pagination.page + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
