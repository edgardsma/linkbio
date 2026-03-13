import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

async function buscarClientes(agencyId: string) {
  return prisma.user.findMany({
    where: {
      agencyId,
      role: 'USER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      createdAt: true,
      _count: {
        links: true,
        clicks: true,
      },
      subscription: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function buscarEstatisticasAgencia(agencyId: string) {
  const clientes = await prisma.user.findMany({
    where: {
      agencyId,
      role: 'USER',
    },
    include: {
      links: {
        select: {
          clicks: true,
        },
      },
    },
  })

  const totalClientes = clientes.length
  const totalLinks = clientes.reduce((sum: number, client: any) => sum + client.links.length, 0)
  const totalCliques = clientes.reduce((sum: number, client: any) =>
    sum + client.links.reduce((linkSum: number, link: any) => linkSum + link.clicks, 0), 0
  )

  return {
    totalClientes,
    totalLinks,
    totalCliques,
    mediaCliquesPorCliente: totalClientes > 0 ? totalCliques / totalClientes : 0,
    mediaCliquesPorLink: totalLinks > 0 ? totalCliques / totalLinks : 0,
  }
}

export default async function PainelAgencia() {
  const session = await getServerSession()

  // Verificar se usuário é agência ou admin
  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = session.user as any

  // Verificar role
  if (user.role !== 'agency' && user.role !== 'admin') {
    redirect('/dashboard')
  }

  // Buscar clientes e estatísticas da agência
  const clientes = await buscarClientes(user.id)
  const estatisticas = await buscarEstatisticasAgencia(user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
      <div style={{ padding: '1rem 1rem 0' }}>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
      </div>
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Painel da Agência
          </h1>
          <p className="text-gray-600">
            Gerencie todos os seus clientes em um único lugar.
          </p>
          <div className="text-sm text-gray-500 mt-2">
            Você está logado como: <span className="font-medium">{user.name || user.email}</span> ({user.role})
          </div>
        </div>

        {/* Abas de navegação */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button className="px-4 py-2 text-blue-600 hover:text-blue-800 border-b-2 border-transparent">
              Clientes
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent">
              Analytics
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent">
              Configurações
            </button>
          </nav>
        </div>

        {/* Seção de Clientes */}
        <div>
          {/* Cabeçalho da Seção */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Clientes
            </h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Novo Cliente
            </button>
          </div>

          {/* Cards de clientes */}
          {clientes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
              <p className="text-gray-500">
                Nenhum cliente cadastrado ainda.
              </p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4">
                + Criar Primeiro Cliente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientes.map((cliente: any) => (
                <div key={cliente.id} className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {cliente.name || cliente.email}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {cliente.email}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cliente._count?.links >= 10 ? 'bg-red-100 text-white' :
                      cliente._count?.links >= 5 ? 'bg-yellow-100 text-white' :
                      'bg-green-100 text-white'
                    }`}>
                      {cliente._count?.links || 0} links
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <a
                      href={`/agency/clients/${cliente.id}`}
                      className="px-3 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                      Ver Detalhes
                    </a>
                    <a
                      href={`/agency/clients/${cliente.id}/analytics`}
                      className="px-3 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                      Analytics
                    </a>
                  </div>

                  {/* Estatísticas do Cliente */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Estatísticas
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Links ativos: <strong>{cliente._count?.links || 0}</strong></div>
                      <div>Total de cliques: <strong>{cliente._count?.clicks || 0}</strong></div>
                      <div>Status: <strong>{cliente.subscription?.status || 'FREE'}</strong></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção de Analytics da Agência */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Analytics da Agência
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total de Clientes */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Total de Clientes
              </h3>
              <div className="text-3xl font-bold text-gray-900">
                {estatisticas.totalClientes}
              </div>
              <div className="text-sm text-gray-600">
                Clientes ativos na plataforma
              </div>
            </div>

            {/* Total de Links */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Total de Links de Clientes
              </h3>
              <div className="text-3xl font-bold text-gray-900">
                {estatisticas.totalLinks}
              </div>
              <div className="text-sm text-gray-600">
                Links criados por todos os clientes
              </div>
            </div>

            {/* Total de Cliques */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Total de Cliques de Clientes
              </h3>
              <div className="text-3xl font-bold text-gray-900">
                {estatisticas.totalCliques}
              </div>
              <div className="text-sm text-gray-600">
                Cliques em todos os links de clientes
              </div>
            </div>

            {/* Média por Cliente */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Média de Cliques/Cliente
              </h3>
              <div className="text-3xl font-bold text-gray-900">
                {estatisticas.mediaCliquesPorCliente.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Média de cliques por cliente
              </div>
            </div>

            {/* Métricas de Conversão */}
            <div className="bg-white rounded-lg shadow border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Métricas de Conversão
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <span>Clientes com conversões</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-900">
                    {Math.round(estatisticas.totalClientes * 0.15)}%
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span>Clientes com links ativos</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-900">
                    {Math.round(estatisticas.totalLinks / estatisticas.totalClientes || 1)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    <span>Cliques/link</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-900">
                    {Math.round(estatisticas.totalCliques / estatisticas.totalLinks || 1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            © 2026 LinkBio Brasil. Painel de Agência Premium.
          </p>
        </div>
      </div>
    </div>
  )
}
