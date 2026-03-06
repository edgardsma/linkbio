'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para gerenciar assinaturas e planos no frontend
 */
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
      window.location.href = url
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
      window.location.href = data.url
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
  const [plans, setPlans] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/checkout')

      if (!response.ok) {
        throw new Error('Falha ao buscar planos')
      }

      const data = await response.json()
      setPlans(data.plans)
    } catch (err) {
      console.error('Erro ao buscar planos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    plans,
    loading,
    error,
    fetchPlans,
  }
}
