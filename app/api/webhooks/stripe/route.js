import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import {
  logWebhookSuccess,
  logWebhookError,
  logWebhookIgnored,
  notifyAdminsAboutError,
} from '@/lib/webhook-logger'

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// Mapeamento de planos Stripe para planos do sistema
const PLAN_MAPPING = {
  'price_starter_1': 'STARTER',
  'price_starter_1_year': 'STARTER',
  'price_pro_1': 'PRO',
  'price_pro_1_year': 'PRO',
  'price_enterprise_1': 'ENTERPRISE',
  'price_enterprise_1_year': 'ENTERPRISE',
}

// Função para obter o plano a partir do price ID
function getPlanFromPriceId(priceId) {
  return PLAN_MAPPING[priceId] || 'PREMIUM'
}

// Função para buscar usuário por customer ID do Stripe
async function getUserByStripeCustomerId(customerId) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  })

  return subscription?.user
}

// Função para processar checkout.session.completed
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('[Webhook] Processando checkout.session.completed:', session.id)

    const customerId = session.customer
    const priceId = session.subscription
      ? (await stripe.subscriptions.retrieve(session.subscription)).items.data[0].price.id
      : session.mode === 'payment'
      ? session.metadata?.price_id
      : null

    // Buscar usuário pelo customer ID ou criar nova assinatura
    let user = await getUserByStripeCustomerId(customerId)

    // Se não encontrar, buscar por email
    if (!user && session.customer_email) {
      user = await prisma.user.findUnique({
        where: { email: session.customer_email },
      })
    }

    if (!user) {
      const error = new Error('Usuário não encontrado para customer: ' + customerId)
      await logWebhookError('checkout.session.completed', session, error)
      throw error
    }

    // Obter detalhes da subscription do Stripe
    let stripeSubscription = null
    if (session.subscription) {
      stripeSubscription = await stripe.subscriptions.retrieve(session.subscription)
    }

    const plan = getPlanFromPriceId(priceId)

    // Criar ou atualizar assinatura
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: 'active',
        plan: plan,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        currentPeriodEnd: stripeSubscription
          ? new Date(stripeSubscription.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias default
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
      },
      update: {
        status: 'active',
        plan: plan,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        currentPeriodEnd: stripeSubscription
          ? new Date(stripeSubscription.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
      },
    })

    console.log('[Webhook] Assinatura criada/atualizada para usuário:', user.email)
    await logWebhookSuccess('checkout.session.completed', session)

    // TODO: Enviar email de boas-vindas
    // await sendWelcomeEmail(user.email, plan)
  } catch (error) {
    await logWebhookError('checkout.session.completed', session, error)
    throw error
  }
}

// Função para processar invoice.paid
async function handleInvoicePaid(invoice) {
  try {
    console.log('[Webhook] Processando invoice.paid:', invoice.id)

    const customerId = invoice.customer
    const subscriptionId = invoice.subscription

    if (!subscriptionId) {
      await logWebhookIgnored('invoice.paid', 'Fatura sem subscription')
      return
    }

    // Buscar detalhes da subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    const priceId = stripeSubscription.items.data[0].price.id
    const plan = getPlanFromPriceId(priceId)

    // Atualizar assinatura
    const updated = await prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: 'active',
        plan: plan,
        stripePriceId: priceId,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    })

    console.log('[Webhook] Assinatura renovada, linhas afetadas:', updated.count)
    await logWebhookSuccess('invoice.paid', invoice)
  } catch (error) {
    await logWebhookError('invoice.paid', invoice, error)
    throw error
  }
}

// Função para processar invoice.payment_failed
async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('[Webhook] Processando invoice.payment_failed:', invoice.id)

    const customerId = invoice.customer
    const subscriptionId = invoice.subscription

    if (!subscriptionId) {
      await logWebhookIgnored('invoice.payment_failed', 'Fatura sem subscription')
      return
    }

    // Atualizar status para past_due
    const updated = await prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: 'past_due',
      },
    })

    console.log('[Webhook] Assinatura marcada como past_due, linhas afetadas:', updated.count)
    await logWebhookSuccess('invoice.payment_failed', invoice)

    // TODO: Enviar email de falha de pagamento
    // await sendPaymentFailedEmail(user.email)
  } catch (error) {
    await logWebhookError('invoice.payment_failed', invoice, error)
    throw error
  }
}

// Função para processar customer.subscription.updated
async function handleCustomerSubscriptionUpdated(subscription) {
  try {
    console.log('[Webhook] Processando customer.subscription.updated:', subscription.id)

    const customerId = subscription.customer
    const priceId = subscription.items.data[0].price.id
    const plan = getPlanFromPriceId(priceId)

    // Atualizar assinatura
    const updated = await prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: subscription.status, // active, past_due, canceled, etc.
        plan: plan,
        stripePriceId: priceId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })

    console.log('[Webhook] Assinatura atualizada, linhas afetadas:', updated.count)
    await logWebhookSuccess('customer.subscription.updated', subscription)
  } catch (error) {
    await logWebhookError('customer.subscription.updated', subscription, error)
    throw error
  }
}

// Função para processar customer.subscription.deleted
async function handleCustomerSubscriptionDeleted(subscription) {
  try {
    console.log('[Webhook] Processando customer.subscription.deleted:', subscription.id)

    const customerId = subscription.customer

    // Atualizar assinatura para canceled
    const updated = await prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: 'canceled',
        plan: 'FREE',
        cancelAtPeriodEnd: true,
      },
    })

    console.log('[Webhook] Assinatura cancelada, linhas afetadas:', updated.count)
    await logWebhookSuccess('customer.subscription.deleted', subscription)

    // TODO: Remover features premium do usuário
    // await removePremiumFeatures(userId)
  } catch (error) {
    await logWebhookError('customer.subscription.deleted', subscription, error)
    throw error
  }
}

// Função principal para processar eventos
async function processEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object)
      break

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object)
      break

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object)
      break

    case 'customer.subscription.updated':
      await handleCustomerSubscriptionUpdated(event.data.object)
      break

    case 'customer.subscription.deleted':
      await handleCustomerSubscriptionDeleted(event.data.object)
      break

    default:
      console.log('[Webhook] Evento não tratado:', event.type)
  }
}

// POST handler para webhooks do Stripe
export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('[Webhook] Assinatura não encontrada')
    return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 400 })
  }

  let event

  try {
    // Verificar assinatura do webhook
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    console.log('[Webhook] Evento recebido:', event.type)

    // Processar evento de forma assíncrona
    // Retornar 200 imediatamente para o Stripe
    processEvent(event).catch((error) => {
      console.error('[Webhook] Erro ao processar evento:', error)
      notifyAdminsAboutError(error, event)
    })

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Webhook] Erro na verificação da assinatura:', error.message)
    return NextResponse.json(
      { error: 'Assinatura inválida', message: error.message },
      { status: 400 }
    )
  }
}

// GET handler para testes
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook do Stripe está funcionando',
  })
}
