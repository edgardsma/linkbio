'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

const SETTINGS_SECTIONS = [
  { id: 'geral', label: 'Geral', icon: '⚙️' },
  { id: 'perfil', label: 'Perfil', icon: '👤' },
  { id: 'notificacoes', label: 'Notificações', icon: '🔔' },
  { id: 'aparencia', label: 'Aparência', icon: '🎨' },
  { id: 'privacidade', label: 'Privacidade', icon: '🔒' },
  { id: 'cobranca', label: 'Cobrança', icon: '💳' },
  { id: 'conta', label: 'Conta', icon: '👥' },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState('geral')

  const [settings, setSettings] = useState({
    nome: session?.user?.name || '',
    apelido: session?.user?.name?.split(' ')[0] || '',
    funcao: '',
    preferencias: '',
    notificacoesEmail: true,
    notificacoesPush: false,
    tema: 'auto',
    fonte: 'padrao',
  })

  const handleSave = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        alert('Configurações salvas com sucesso!')
      }
    } catch (error) {
      alert('Erro ao salvar configurações')
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'geral':
        return <GeralSection settings={settings} setSettings={setSettings} onSave={handleSave} />
      case 'perfil':
        return <PerfilSection settings={settings} setSettings={setSettings} onSave={handleSave} />
      case 'notificacoes':
        return <NotificacoesSection settings={settings} setSettings={setSettings} onSave={handleSave} />
      case 'aparencia':
        return <AparenciaSection settings={settings} setSettings={setSettings} onSave={handleSave} />
      case 'privacidade':
        return <PrivacidadeSection settings={settings} setSettings={setSettings} onSave={handleSave} />
      case 'cobranca':
        return <CobrancaSection />
      case 'conta':
        return <ContaSection />
      default:
        return <GeralSection settings={settings} setSettings={setSettings} onSave={handleSave} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas preferências e conta
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu Lateral */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sticky top-8">
              <ul className="space-y-2">
                {SETTINGS_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        activeSection === section.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-xl">{section.icon}</span>
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1 min-w-0">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  )
}

// Componentes de Seção
function GeralSection({ settings, setSettings, onSave }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8">
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Geral
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome de exibição
            </label>
            <input
              type="text"
              value={settings.nome}
              onChange={(e) => setSettings({ ...settings, nome: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Como você gostaria de ser chamado?
            </label>
            <input
              type="text"
              value={settings.apelido}
              onChange={(e) => setSettings({ ...settings, apelido: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Qual é a sua função?
            </label>
            <select
              value={settings.funcao}
              onChange={(e) => setSettings({ ...settings, funcao: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecione sua função</option>
              <option value="creator">Criador de Conteúdo</option>
              <option value="business">Negócios</option>
              <option value="agency">Agência</option>
              <option value="freelancer">Freelancer</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferências de resposta
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Isso ajudará a personalizar sua experiência no LinkBio Brasil
            </p>
            <textarea
              value={settings.preferencias}
              onChange={(e) => setSettings({ ...settings, preferencias: e.target.value })}
              rows={4}
              placeholder="Ex.: Prefiro mensagens diretas e objetivas"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  )
}

function PerfilSection({ settings, setSettings, onSave }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8">
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Perfil
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto de perfil
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-2xl font-bold text-purple-700 dark:text-purple-300">
                {settings.nome?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                Alterar foto
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              rows={4}
              placeholder="Conte um pouco sobre você..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site ou portfólio
            </label>
            <input
              type="url"
              placeholder="https://exemplo.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Links sociais
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="url"
                placeholder="Instagram"
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="url"
                placeholder="Twitter/X"
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="url"
                placeholder="LinkedIn"
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="url"
                placeholder="YouTube"
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Salvar Perfil
        </button>
      </div>
    </div>
  )
}

function NotificacoesSection({ settings, setSettings, onSave }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8">
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Notificações
        </h2>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Novos seguidores
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receba notificações quando alguém seguir seu perfil
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificacoesEmail}
                onChange={(e) => setSettings({ ...settings, notificacoesEmail: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Cliques nos links
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receba resumos semanais de cliques nos seus links
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificacoesPush}
                onChange={(e) => setSettings({ ...settings, notificacoesPush: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Notificações por e-mail
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receba atualizações importantes no seu e-mail
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificacoesEmail}
                onChange={(e) => setSettings({ ...settings, notificacoesEmail: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Novidades do LinkBio Brasil
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fique por dentro das novidades e funcionalidades
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Salvar Preferências
        </button>
      </div>
    </div>
  )
}

function AparenciaSection({ settings, setSettings, onSave }) {
  const temas = [
    { id: 'claro', label: 'Claro', icon: '☀️' },
    { id: 'auto', label: 'Auto', icon: '🌓' },
    { id: 'escuro', label: 'Escuro', icon: '🌙' },
  ]

  const fontes = [
    { id: 'padrao', label: 'Padrão' },
    { id: 'sans', label: 'Sans' },
    { id: 'serif', label: 'Serif' },
    { id: 'mono', label: 'Mono' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8">
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Aparência
        </h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Modo de cor
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {temas.map((tema) => (
                <button
                  key={tema.id}
                  onClick={() => setSettings({ ...settings, tema: tema.id })}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    settings.tema === tema.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{tema.icon}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{tema.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Fonte
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {fontes.map((fonte) => (
                <button
                  key={fonte.id}
                  onClick={() => setSettings({ ...settings, fonte: fonte.id })}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    settings.fonte === fonte.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <span className="text-sm font-mono mb-2 block">Aa</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{fonte.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Salvar Aparência
        </button>
      </div>
    </div>
  )
}

function PrivacidadeSection({ settings, setSettings, onSave }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8">
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Privacidade
        </h2>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Perfil público
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seu perfil pode ser encontrado por qualquer um
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Mostrar estatísticas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exibir contadores de cliques nos seus links
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Permitir busca por nome de usuário
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seu perfil aparece nos resultados de busca
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Salvar Privacidade
        </button>
      </div>
    </div>
  )
}

function CobrancaSection() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8">
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Cobrança
        </h2>
        <div className="space-y-6">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
              Plano Atual
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              Gratuito
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Você está usando o plano básico do LinkBio Brasil
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Histórico de cobrança
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma cobrança registrada
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Métodos de pagamento
            </h3>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
              Adicionar método de pagamento
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <a
          href="/dashboard/plans"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Ver Planos
        </a>
      </div>
    </div>
  )
}

function ContaSection() {
  const { signOut } = useSession()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8">
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Conta
        </h2>
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xl font-bold text-purple-700 dark:text-purple-300">
              U
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">usuário@exemplo.com</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuário padrão</p>
            </div>
            <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
              Editar
            </button>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Mudar senha
            </h3>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
              Enviar e-mail de redefinição
            </button>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Contas conectadas
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">G</span>
                  <span className="text-gray-700 dark:text-gray-300">Google</span>
                </div>
                <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Desconectar
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">
              Zona de perigo
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium transition-colors">
                Excluir minha conta
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
