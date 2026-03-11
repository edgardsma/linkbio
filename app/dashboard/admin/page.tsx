'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  users: {
    total: number
    newToday: number
    newThisMonth: number
    withActiveSubscription: number
  }
  links: {
    total: number
    active: number
    inactive: number
  }
  clicks: {
    total: number
  }
}

interface UserItem {
  id: string
  name: string | null
  email: string
  username: string
  role: string
  createdAt: string
  _count: { links: number }
  subscription: { status: string; plan: string } | null
}

interface UsersResponse {
  users: UserItem[]
  pagination: { total: number; page: number; limit: number; pages: number }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<Stats | null>(null)
  const [usersData, setUsersData] = useState<UsersResponse | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const sessionUser = session?.user as { role?: string } | undefined

  // Redirecionar se não for admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated' && sessionUser?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, sessionUser, router])

  // Buscar stats
  useEffect(() => {
    if (sessionUser?.role === 'admin') {
      fetchStats()
    }
  }, [sessionUser])

  // Buscar usuários quando filtros mudarem
  useEffect(() => {
    if (sessionUser?.role === 'admin') {
      fetchUsers()
    }
  }, [sessionUser, page, roleFilter])

  async function fetchStats() {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setStats(await res.json())
    } catch {
      // silencioso
    } finally {
      setLoadingStats(false)
    }
  }

  async function fetchUsers() {
    setLoadingUsers(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) setUsersData(await res.json())
    } catch {
      // silencioso
    } finally {
      setLoadingUsers(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingRole(userId)
    setMessage('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Role de ${data.user.name || data.user.username} atualizada para ${newRole}`)
        fetchUsers()
      } else {
        setMessage(`Erro: ${data.error}`)
      }
    } catch {
      setMessage('Erro ao atualizar role')
    } finally {
      setUpdatingRole(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (sessionUser?.role !== 'admin') return null

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      agency: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      user: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    }
    return colors[role] || colors.user
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">LinkBio Brasil</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Cards de Estatísticas */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Visão Geral da Plataforma
          </h2>
          {loadingStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse h-28" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.users.total.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.users.newToday} hoje · +{stats.users.newThisMonth} este mês
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Links Criados</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.links.total.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.links.active} ativos · {stats.links.inactive} inativos
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Cliques Totais</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.clicks.total.toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Assinaturas Ativas</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {stats.users.withActiveSubscription.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Erro ao carregar estatísticas.</p>
          )}
        </section>

        {/* Gerenciamento de Usuários */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gerenciamento de Usuários
          </h2>

          {/* Filtros */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, email ou username..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos os roles</option>
              <option value="user">Usuário</option>
              <option value="agency">Agência</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition"
            >
              Buscar
            </button>
          </form>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
              message.startsWith('Erro')
                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {message}
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loadingUsers ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : usersData && usersData.users.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Links
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                          Plano
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                          Cadastro
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {usersData.users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.name || '(sem nome)'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                              <p className="text-xs text-purple-600 dark:text-purple-400">@{user.username}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-300">
                            {user._count.links}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {user.subscription ? (
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                {user.subscription.plan} ({user.subscription.status})
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Free</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role}
                              disabled={updatingRole === user.id}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                            >
                              <option value="user">user</option>
                              <option value="agency">agency</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {usersData.pagination.pages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {usersData.pagination.total} usuários · página {page} de {usersData.pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={page >= usersData.pagination.pages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
