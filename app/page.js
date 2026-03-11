import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import PricingPlans from '@/components/PricingPlans'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 lg:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-purple-100 dark:bg-purple-900/30 rounded-full px-4 py-2 mb-8">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">🚀 Novo: Análises avançadas incluídas</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-gray-900 dark:text-white leading-tight">
              Seus Links em{' '}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Um Só Lugar
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Crie sua página personalizada de links profissionais. Compartilhe tudo o que importa com seu público de forma elegante e moderna.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/auth/signup" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                <span className="flex items-center gap-2">
                  Começar Grátis
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link href="#features" className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700">
                Ver Recursos
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Usado por milhares de criadores de conteúdo</p>
              <div className="flex items-center gap-8 opacity-60">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Usuários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">500K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cliques</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Tudo que você precisa para brilhar online
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Recursos poderosos que fazem a diferença na sua presença digital
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Links Ilimitados</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Adicione quantos links quiser. Organize-os por prioridade e veja quais performam melhor.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Análises Avançadas</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Acompanhe cliques em tempo real, veja de onde vêm seus visitantes e otimize sua estratégia.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Personalização Total</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Escolha cores, fontes, ícones e layouts que representem sua marca perfeitamente.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Responsivo</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Sua página fica perfeita em qualquer dispositivo - desktop, tablet ou celular.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Rápido e Seguro</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Tecnologia de ponta garante velocidade e segurança para você e seus visitantes.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Fácil de Usar</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Interface intuitiva que você domina em minutos. Suporte em português 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Como Funciona</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Em 3 passos simples, você terá sua página profissional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-colors">
                <span className="text-3xl font-bold">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Crie sua Conta</h3>
              <p className="text-lg opacity-90 leading-relaxed">
                Cadastre-se gratuitamente e personalize seu perfil com foto e bio.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-colors">
                <span className="text-3xl font-bold">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Adicione seus Links</h3>
              <p className="text-lg opacity-90 leading-relaxed">
                Inclua todos os seus links importantes - Instagram, YouTube, site, etc.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-colors">
                <span className="text-3xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Compartilhe</h3>
              <p className="text-lg opacity-90 leading-relaxed">
                Use seu link personalizado em bio e veja os resultados crescerem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <PricingPlans />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Milhares de criadores já transformaram sua presença online
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { initial: 'M', name: 'Maria Silva', role: 'Influencer Fitness', gradient: 'from-purple-500 to-blue-500', bg: 'from-purple-50 to-blue-50', text: '"Incrível como ficou profissional! Meus seguidores adoraram e o número de cliques aumentou muito."' },
              { initial: 'J', name: 'João Santos', role: 'Youtuber Tech', gradient: 'from-blue-500 to-indigo-500', bg: 'from-blue-50 to-indigo-50', text: '"As análises são fantásticas! Agora sei exatamente quais links performam melhor. Recomendo demais!"' },
              { initial: 'A', name: 'Ana Costa', role: 'Fotógrafa', gradient: 'from-indigo-500 to-purple-500', bg: 'from-indigo-50 to-purple-50', text: '"A personalização é incrível! Minha página ficou exatamente como eu imaginava. Clientes amaram!"' },
            ].map((t) => (
              <div key={t.name} className={`bg-gradient-to-br ${t.bg} dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl shadow-lg`}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${t.gradient} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {t.initial}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 dark:text-white">{t.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Perguntas Frequentes
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { q: 'É realmente gratuito?', a: 'Sim! Você pode criar sua página gratuitamente com recursos básicos. Os planos pagos desbloqueiam análises avançadas e personalizações premium.' },
              { q: 'Posso personalizar minha página?', a: 'Absolutamente! Escolha cores, fontes, ícones e até mesmo seu próprio domínio personalizado nos planos premium.' },
              { q: 'Como vejo as estatísticas?', a: 'No seu dashboard, você tem acesso a gráficos detalhados mostrando cliques por link, origem dos visitantes e muito mais.' },
              { q: 'É seguro usar?', a: 'Totalmente! Usamos criptografia SSL, autenticação segura e seguimos as melhores práticas de segurança da indústria.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{faq.q}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Pronto para transformar sua presença online?
          </h2>
          <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
            Junte-se a milhares de criadores que já escolheram o LinkBio Brasil
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="px-8 py-4 bg-white text-purple-600 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
              Começar Agora - É Grátis!
            </Link>
            <Link href="/auth/login" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl text-lg font-semibold hover:bg-white/10 transition-all">
              Fazer Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p className="font-semibold text-lg mb-2">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">LinkBio Brasil</span>
          </p>
          <p className="text-sm mb-4">A maneira mais elegante de compartilhar todos os seus links em um só lugar.</p>
          <p className="text-sm">&copy; 2025 LinkBio Brasil. Todos os direitos reservados.</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacidade</Link>
            <Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Termos</Link>
            <Link href="/pricing" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Planos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
