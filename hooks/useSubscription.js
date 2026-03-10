'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para gerenciar assinaturas e planos no frontend
 */

// Definição dos planos disponíveis
const AVAILABLE_PLANS = {
  free: {
    name: 'FREE',
    description: 'Perfeito para começar',
    monthly: { price: 0, savings: null },
    annual: { price: 0, savings: null },
    features: [
      'Até 5 links por página',
      'Análises básicas de cliques',
      '1 tema pré-definido',
      'Suporte por email',
      'QR Code padrão',
    ],
  },
  starter: {
    name: 'STARTER',
    description: 'Ideal para profissionais',
    monthly: { price: 19.90, savings: 'Economize R$ 40' },
    annual: { price: 199.90, savings: 'Economize R$ 40' },
    features: [
      'Até 15 links por página',
      'Análises completas de cliques',
      '5 temas personalizáveis',
      'Suporte prioritário',
      'QR Code personalizado',
      'Sem marca d\'água',
    ],
  },
  pro: {
    name: 'PRO',
    description: 'Para negócios em crescimento',
    monthly: { price: 49.90, savings: 'Economize R$ 100' },
    annual: { price: 499.90, savings: 'Economize R$ 100' },
    features: [
      'Links ilimitados',
      'Análises completas de cliques',
      'Customização completa',
      'Domínio personalizado',
      'Suporte 24/7',
      'API básica',
      'Remoção completa de marca',
    ],
  },
  premium: {
    name: 'PREMIUM',
    description: 'Para grandes empresas',
    monthly: { price: 99.90, savings: 'Economize R$ 200' },
    annual: { price: 999.90, savings: 'Economize R$ 200' },
    features: [
      'Tudo do plano PRO',
      'API completa',
      'Gerente de conta dedicado',
      'Suporte por telefone',
      'SLA garantido de 99.9%',
      'Integrações customizadas',
      'White-label completo',
    ],
  },
}

export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stripeConfigured, setStripeConfigured] = useState(false)

  useEffect(() => {
    checkStripeStatus()
  }, [])

  const checkStripeStatus = async () => {
    try {
      const response = await fetch('/api/stripe/status')
      const data = await response.json()
      setStripeConfigured(data.stripeConfigured)

      if (data.stripeConfigured) {
        fetchSubscription()
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Erro ao verificar status do Stripe:', err)
      setLoading(false)
    }
  }

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/portal')

      if (!response.ok) {
        throw new Error('Falha ao buscar assinatura')
      }

      const data = await response.json()
      setSubscription(data)
    } catch (err) {
      console.error('Erro ao buscar assinatura:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCheckoutSession = async (plan, billingCycle = 'monthly') => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingCycle,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Falha ao criar sessão de checkout')
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Erro ao criar checkout:', err)
      throw err
    }
  }

  const redirectToCheckout = async (plan, billingCycle = 'monthly') => {
    try {
      const { url } = await createCheckoutSession(plan, billingCycle)
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      throw err
    }
  }

  const openBillingPortal = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Falha ao abrir portal de faturamento')
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Erro ao abrir portal:', err)
      throw err
    }
  }

  return {
    subscription,
    loading,
    error,
    stripeConfigured,
    hasSubscription: subscription?.hasSubscription || false,
    plan: subscription?.subscription?.plan || 'free',
    status: subscription?.subscription?.status || 'active',
    isPremium: ['starter', 'pro', 'premium'].includes(
      subscription?.subscription?.plan || 'free'
    ),
    fetchSubscription,
    createCheckoutSession,
    redirectToCheckout,
    openBillingPortal,
  }
}

/**
 * Hook para buscar informações dos planos disponíveis
 */
export function usePlans() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/stripe/checkout')

        if (!response.ok) {
          throw new Error('Falha ao buscar planos')
        }

        const data = await response.json()
        setLoading(false)
      } catch (err) {
        console.error('Erro ao buscar planos:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  return {
    plans: AVAILABLE_PLANS,
    loading,
    error,
  }
}
