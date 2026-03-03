import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
})

// Webhook secret do Stripe (obtido no dashboard)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Mapeamento de status do Stripe para nosso banco
const STATUS_MAP = {
  incomplete: 'pending',
  incomplete_expired: 'canceled',
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'past_due',
}

export async function POST(request) {
  try {
    // Obter corpo da requisição como texto
    const body = await request.text()

    // Obter assinatura do webhook
    const signature = headers().get('stripe-signature')

    if (!signature) {
      console.error('Assinatura do webhook não encontrada')
      return Response.json(
        { error: 'Assinatura do webhook não encontrada' },
        { status: 400 }
      )
    }

    // Verificar e construir evento
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Erro ao verificar assinatura do webhook:', err.message)
      return Response.json(
        { error: 'Assinatura do webhook inválida' },
        { status: 400 }
      )
    }

    console.log(`Webhook recebido: ${event.type}`)

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        await handleSubscriptionCreated(subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        console.log('Pagamento bem-sucedido:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        console.log('Pagamento falhou:', paymentIntent.id)
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    // Retornar sucesso
    return Response.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return Response.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

// Handler para checkout.session.completed
async function handleCheckoutCompleted(session) {
  try {
    const { userId, plan, billingCycle } = session.metadata

    if (!userId) {
      console.error('userId não encontrado nos metadados da sessão')
      return
    }

    // Atualizar customer ID se ainda não estiver salvo
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (subscription) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          stripeCustomerId: session.customer,
          stripePriceId: session.subscription
            ? (await stripe.subscriptions.retrieve(session.subscription)).items.data[0].price.id
            : null,
        },
      })
    }

    console.log(`Checkout completado para usuário: ${userId}`)
  } catch (error) {
    console.error('Erro ao processar checkout.session.completed:', error)
  }
}

// Handler para customer.subscription.created
async function handleSubscriptionCreated(subscription) {
  try {
    const { userId, plan, billingCycle } = subscription.metadata

    if (!userId || !plan) {
      console.error('userId ou plan não encontrado nos metadados da assinatura')
      return
    }

    // Calcular data de término do período
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Criar ou atualizar assinatura no banco
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: subscription.customer,
        stripePriceId: subscription.items.data[0].price.id,
        status: STATUS_MAP[subscription.status] || 'pending',
        plan,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeCustomerId: subscription.customer,
        stripePriceId: subscription.items.data[0].price.id,
        status: STATUS_MAP[subscription.status] || 'pending',
        plan,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })

    console.log(`Assinatura criada para usuário: ${userId}, plano: ${plan}`)
  } catch (error) {
    console.error('Erro ao processar customer.subscription.created:', error)
  }
}

// Handler para customer.subscription.updated
async function handleSubscriptionUpdated(subscription) {
  try {
    const { userId, plan, billingCycle } = subscription.metadata

    // Se não tiver metadados, buscar pelo customer
    if (!userId) {
      const customerId = subscription.customer
      const existingSubscription = await prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      })

      if (!existingSubscription) {
        console.error('Assinatura não encontrada para customer:', customerId)
        return
      }

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: STATUS_MAP[subscription.status] || 'pending',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      })
    } else {
      // Atualizar assinatura com metadados
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

      await prisma.subscription.update({
        where: { userId },
        data: {
          status: STATUS_MAP[subscription.status] || 'pending',
          plan: plan || 'pro', // Usar plano dos metadados ou padrão
          stripePriceId: subscription.items.data[0].price.id,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      })
    }

    console.log(`Assinatura atualizada: ${subscription.id}`)
  } catch (error) {
    console.error('Erro ao processar customer.subscription.updated:', error)
  }
}

// Handler para customer.subscription.deleted
async function handleSubscriptionDeleted(subscription) {
  try {
    const customerId = subscription.customer

    // Buscar assinatura pelo customer ID
    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!existingSubscription) {
      console.error('Assinatura não encontrada para customer:', customerId)
      return
    }

    // Atualizar status para canceled
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'canceled',
        plan: 'free',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    console.log(`Assinatura cancelada: ${subscription.id}`)
  } catch (error) {
    console.error('Erro ao processar customer.subscription.deleted:', error)
  }
}

// Handler para invoice.payment_succeeded
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const customerId = invoice.customer

    // Buscar assinatura
    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!existingSubscription) {
      console.error('Assinatura não encontrada para customer:', customerId)
      return
    }

    // Atualizar período de renovação
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: STATUS_MAP[subscription.status] || 'active',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })
    }

    console.log(`Pagamento de fatura bem-sucedido: ${invoice.id}`)
  } catch (error) {
    console.error('Erro ao processar invoice.payment_succeeded:', error)
  }
}

// Handler para invoice.payment_failed
async function handleInvoicePaymentFailed(invoice) {
  try {
    const customerId = invoice.customer

    // Buscar assinatura
    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!existingSubscription) {
      console.error('Assinatura não encontrada para customer:', customerId)
      return
    }

    // Atualizar status para past_due
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: STATUS_MAP[subscription.status] || 'past_due',
        },
      })
    }

    console.log(`Pagamento de fatura falhou: ${invoice.id}`)
  } catch (error) {
    console.error('Erro ao processar invoice.payment_failed:', error)
  }
}
