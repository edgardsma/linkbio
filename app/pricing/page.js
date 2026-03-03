'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Navbar } from '@/components/Navbar'

export default function PricingPage() {
  const { data: session, status } = useSession()
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(null)

  // Configuração dos planos
  const plans = [
    {
      id: 'free',
      name: 'FREE',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '5 links',
        'Analytics básicos',
        '1 tema pré-definido',
        'Suporte por email',
        'QR Code padrão',
        'LinkBio Brasil no footer'
      ],
      cta: 'Começar Grátis',
      popular: false,
      gradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900',
      borderColor: 'border-gray-300 dark:border-gray-700',
      buttonText: 'bg-gray-600 hover:bg-gray-700 text-white',
      priceId: null
    },
    {
      id: 'starter',
      name: 'STARTER',
      monthlyPrice: 19.9,
      yearlyPrice: 199,
      features: [
        '15 links',
        'Analytics avançados',
        '5 temas personalizáveis',
        'Suporte prioritário',
        'QR Code personalizado',
        'Sem marca d\'água',
        'Integração com redes sociais',
        'Agendamento de links'
      ],
      cta: 'Assinar Starter',
      popular: false,
      gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30',
      borderColor: 'border-blue-300 dark:border-blue-700',
      buttonText: 'bg-blue-600 hover:bg-blue-700 text-white',
      priceId: null
    },
    {
      id: 'pro',
      name: 'PRO',
      monthlyPrice: 49.9,
      yearlyPrice: 499,
      features: [
        'Links ilimitados',
        'Analytics completos em tempo real',
        'Customização completa',
        'Domínio personalizado',
        'Suporte 24/7',
        'API básica',
        'Remoção completa de marca',
        'Temas ilimitados',
        'Exportação de dados',
        'Acesso antecipado a recursos'
      ],
      cta: 'Assinar PRO',
      popular: true,
      gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30',
      borderColor: 'border-purple-400 dark:border-purple-600',
      buttonText: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white',
      priceId: null
    },
    {
      id: 'premium',
      name: 'PREMIUM',
      monthlyPrice: 99.9,
      yearlyPrice: 999,
      features: [
        'Tudo do plano PRO',
        'API completa com rate limit alto',
        'Gerente de conta dedicado',
        'Suporte por telefone',
        'SLA garantido de 99.9%',
        'Integrações customizadas',
        'White-label completo',
        'Multi-usuários',
        'Auditorias de segurança',
        'Consultoria mensal',
        'Features exclusivas beta'
      ],
      cta: 'Assinar PREMIUM',
      popular: false,
      gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30',
      borderColor: 'border-amber-400 dark:border-amber-600',
      buttonText: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
      priceId: null
    }
  ]

  // Perguntas frequentes
  const faqs = [
    {
      question: 'Posso alterar meu plano a qualquer momento?',
      answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Ao fazer upgrade, você terá acesso imediato aos novos recursos. Ao fazer downgrade, as alterações serão aplicadas no próximo ciclo de faturamento.'
    },
    {
      question: 'O que acontece se eu exceder o limite de links?',
      answer: 'No plano FREE, você será notificado quando atingir o limite de 5 links. Para adicionar mais links, você precisará fazer upgrade para um plano pago. Nos planos pagos, você sempre tem a opção de adicionar mais links.'
    },
    {
      question: 'Como funciona a cobrança anual?',
      answer: 'Ao optar pelo pagamento anual, você economiza aproximadamente 17% em comparação com o pagamento mensal. A cobrança é feita uma vez por ano e você pode cancelar a qualquer momento antes da próxima renovação.'
    },
    {
      question: 'Posso usar meu próprio domínio?',
      answer: 'Sim! Nos planos PRO e PREMIUM, você pode conectar seu próprio domínio personalizado (ex: links.seusite.com). Nossa equipe de suporte está disponível para ajudar você na configuração.'
    },
    {
      question: 'Como funciona a garantia?',
      answer: 'Oferecemos uma garantia de 14 dias para novos assinantes. Se você não estiver satisfeito com o serviço, entraremos em contato para devolver o valor integral, sem perguntas.'
    },
    {
      question: 'Como faço para cancelar minha assinatura?',
      answer: 'Você pode cancelar sua assinatura a qualquer momento através do dashboard ou entrando em contato com o suporte. Após o cancelamento, você continuará com acesso aos recursos pagos até o final do período atual.'
    }
  ]

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') {
      // Plano free não precisa de checkout
      if (!session) {
        window.location.href = '/auth/signup'
        return
      }
      window.location.href = '/dashboard'
      return
    }

    if (!session) {
      window.location.href = '/auth/signup?redirect=/pricing'
      return
    }

    setLoadingPlan(plan.id)

    try {
      const billingCycle = isAnnual ? 'annual' : 'monthly'
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          billingCycle: billingCycle,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao processar checkout')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error)
      alert('Erro ao processar checkout: ' + error.message)
    } finally {
      setLoadingPlan(null)
    }
  }

  const getCurrentPlan = () => {
    // Verificar plano atual do usuário (você pode ajustar isso baseado no seu schema)
    if (session?.user?.subscription?.plan) {
      return session.user.subscription.plan.toLowerCase()
    }
    return null
  }

  const isPlanCurrent = (planId) => {
    const currentPlan = getCurrentPlan()
    return currentPlan === planId
  }

  const formatPrice = (price) => {
    return price === 0 ? 'Grátis' : `R$${price.toLocaleString('pt-BR')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
          Escolha o Plano{' '}
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Perfeito para Você
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
          Comece grátis e faça upgrade quando precisar. Sem contratos, sem surpresas.
          Cancele a qualquer momento.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg mb-12">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              !isAnnual
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              isAnnual
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Anual
            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
              -17%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gradient-to-br ${plan.gradient} rounded-2xl p-6 border-2 ${
                plan.popular ? `${plan.borderColor} scale-105 shadow-2xl` : `${plan.borderColor}`
              } transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Mais Popular
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(isAnnual ? plan.yearlyPrice : plan.monthlyPrice)}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-gray-600 dark:text-gray-400">
                      /{isAnnual ? 'ano' : 'mês'}
                    </span>
                  )}
                </div>
                {isAnnual && plan.yearlyPrice > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Economize R${((plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2))}
                  </p>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.id || (status === 'loading')}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  isPlanCurrent(plan.id)
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    : plan.buttonText
                } disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg`}
              >
                {loadingPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processando...
                  </span>
                ) : isPlanCurrent(plan.id) ? (
                  'Plano Atual'
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="container mx-auto px-4 py-16 bg-white dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Comparação de Recursos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-4 text-gray-900 dark:text-white font-semibold">Recurso</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Links', values: ['5', '15', 'Ilimitados', 'Ilimitados'] },
                { feature: 'Analytics', values: ['Básicos', 'Avançados', 'Completos', 'Completos'] },
                { feature: 'Temas', values: ['1', '5', 'Ilimitados', 'Ilimitados'] },
                { feature: 'Domínio Personalizado', values: ['Não', 'Não', 'Sim', 'Sim'] },
                { feature: 'API', values: ['Não', 'Não', 'Básica', 'Completa'] },
                { feature: 'Suporte', values: ['Email', 'Prioritário', '24/7', 'Dedicado'] },
                { feature: 'Marca d\'água', values: ['Sim', 'Não', 'Não', 'Não'] },
                { feature: 'QR Code', values: ['Padrão', 'Personalizado', 'Personalizado', 'Personalizado'] },
                { feature: 'SLA', values: ['Não', 'Não', 'Não', '99.9%'] },
              ].map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{row.feature}</td>
                  {row.values.map((value, colIndex) => (
                    <td key={colIndex} className="py-4 px-4 text-center">
                      {value === 'Sim' ? (
                        <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : value === 'Não' ? (
                        <svg className="w-6 h-6 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">{value}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Perguntas Frequentes
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Pronto para Começar?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já transformaram sua presença online com LinkBio Brasil.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!session ? (
              <>
                <Link
                  href="/auth/signup"
                  className="px-8 py-4 bg-white text-purple-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
                >
                  Criar Conta Grátis
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white/10 transition"
                >
                  Fazer Login
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white text-purple-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
              >
                Ir para Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 LinkBio Brasil. Todos os direitos reservados.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400">
              Política de Privacidade
            </Link>
            <Link href="/contact" className="hover:text-purple-600 dark:hover:text-purple-400">
              Contato
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
