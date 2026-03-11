import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma.js'
import { apiLogger } from '@/lib/logger'
import { getRequestId, withRequestId } from '@/lib/middleware'

// Listar pagamentos e faturas do usuário
export async function GET(request) {
  const requestId = getRequestId(request)

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      apiLogger.warn('Usuário não autenticado', { requestId })
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar pagamentos
    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            stripePriceId: true,
            currentPeriodEnd: true,
            stripeCustomerId: true,
          },
        },
      },
      take: 50,
    })

    // Buscar todas as assinaturas do usuário (incluindo canceladas)
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Formatar dados
    const formattedPayments = await Promise.all(payments.map(async payment => {
      // Tentar buscar detalhes do preço do Stripe
      let priceDetails = null
      if (payment.stripePriceId && process.env.STRIPE_SECRET_KEY) {
        try {
          const Stripe = require('stripe')
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia',
          })
          const price = await stripe.prices.retrieve(payment.stripePriceId)
          priceDetails = {
            id: price.id,
            amount: price.unit_amount / 100,
            currency: price.currency.toUpperCase(),
            interval: price.recurring.interval,
            intervalCount: price.recurring.interval_count,
          }
        } catch (error) {
          apiLogger.warn('Erro ao buscar detalhes do preço', {
            requestId,
            stripePriceId: payment.stripePriceId,
            error: error.message,
          })
        }
      }

      return {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        stripeInvoiceId: payment.stripeInvoiceId,
        createdAt: payment.createdAt,
        subscription: payment.subscription,
        priceDetails,
      }
    }))

    const formattedSubscriptions = subscriptions.map(subscription => {
      // Calcular dias restantes
      const daysRemaining = subscription.status === 'active'
        ? Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
        : 0

      // Formatar valor do plano
      const planValues = {
        free: 0,
        starter: 9.99,
        pro: 19.99,
        premium: 49.99,
      }
      const planValue = planValues[subscription.plan] || 0

      return {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        planValue,
        stripePriceId: subscription.stripePriceId,
        stripeCustomerId: subscription.stripeCustomerId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining,
        createdAt: subscription.createdAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      }
    })

    apiLogger.info('Histórico de pagamentos carregado', {
      requestId,
      userId: session.user.id,
      paymentsCount: formattedPayments.length,
      subscriptionsCount: formattedSubscriptions.length,
    })

    return withRequestId(
      NextResponse.json({
        payments: formattedPayments,
        subscriptions: formattedSubscriptions,
        summary: {
        totalPaid: formattedPayments
          .filter(p => p.status === 'succeeded')
          .reduce((sum, p) => sum + p.amount, 0),
        totalPayments: formattedPayments.length,
        activeSubscription: subscriptions.find(s => s.status === 'active'),
      },
      }),
      requestId
    )
  } catch (error) {
    apiLogger.error('Erro ao carregar histórico de pagamentos', error, { requestId })
    return NextResponse.json(
      { error: 'Erro ao carregar histórico de pagamentos' },
      { status: 500 }
    )
  }
}
