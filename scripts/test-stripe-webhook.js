/**
 * Script para testar webhooks do Stripe
 *
 * Uso:
 * node scripts/test-stripe-webhook.js
 */

import Stripe from 'stripe'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
})

/**
 * Cria uma sessão de checkout de teste
 */
async function createTestCheckoutSession(customerEmail, priceId) {
  try {
    console.log('[Test] Criando checkout session...')

    // Criar cliente de teste
    const customer = await stripe.customers.create({
      email: customerEmail || 'test@example.com',
      name: 'Test User',
      metadata: {
        test: 'true',
      },
    })

    console.log('[Test] Customer criado:', customer.id)

    // Criar checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || 'price_test', // Substitua com price ID real de teste
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/dashboard?success=true',
      cancel_url: 'http://localhost:3000/pricing?canceled=true',
      metadata: {
        test: 'true',
      },
    })

    console.log('[Test] Checkout session criada:', session.id)
    console.log('[Test] URL:', session.url)

    return session
  } catch (error) {
    console.error('[Test] Erro ao criar checkout session:', error)
    throw error
  }
}

/**
 * Cria uma assinatura de teste (sem checkout)
 */
async function createTestSubscription(customerEmail, priceId) {
  try {
    console.log('[Test] Criando subscription direta...')

    // Criar cliente
    const customer = await stripe.customers.create({
      email: customerEmail || 'test@example.com',
      name: 'Test User',
      metadata: { test: 'true' },
    })

    console.log('[Test] Customer criado:', customer.id)

    // Criar método de pagamento de teste
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    })

    // Anexar ao cliente
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    })

    // Definir como método padrão
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    })

    console.log('[Test] Payment method configurado')

    // Criar subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: priceId || 'price_test', // Substitua com price ID real
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { test: 'true' },
    })

    console.log('[Test] Subscription criada:', subscription.id)
    console.log('[Test] Status:', subscription.status)

    return subscription
  } catch (error) {
    console.error('[Test] Erro ao criar subscription:', error)
    throw error
  }
}

/**
 * Simula pagamento de fatura
 */
async function payInvoice(invoiceId) {
  try {
    console.log('[Test] Pagando invoice:', invoiceId)

    const invoice = await stripe.invoices.pay(invoiceId)

    console.log('[Test] Invoice paga:', invoice.id)
    console.log('[Test] Status:', invoice.status)

    return invoice
  } catch (error) {
    console.error('[Test] Erro ao pagar invoice:', error)
    throw error
  }
}

/**
 * Cancela uma assinatura de teste
 */
async function cancelSubscription(subscriptionId) {
  try {
    console.log('[Test] Cancelando subscription:', subscriptionId)

    const subscription = await stripe.subscriptions.cancel(subscriptionId)

    console.log('[Test] Subscription cancelada')
    console.log('[Test] Status:', subscription.status)

    return subscription
  } catch (error) {
    console.error('[Test] Erro ao cancelar subscription:', error)
    throw error
  }
}

/**
 * Lista webhooks configurados
 */
async function listWebhooks() {
  try {
    console.log('[Test] Listando webhooks...')

    const webhooks = await stripe.webhookEndpoints.list()

    console.log(`[Test] ${webhooks.data.length} webhooks encontrados:`)
    webhooks.data.forEach((wh) => {
      console.log(`  - ${wh.url}`)
      console.log(`    Events: ${wh.enabled_events.length}`)
      console.log(`    Status: ${wh.status}`)
      console.log('')
    })

    return webhooks.data
  } catch (error) {
    console.error('[Test] Erro ao listar webhooks:', error)
    throw error
  }
}

/**
 * Lista todos os preços
 */
async function listPrices() {
  try {
    console.log('[Test] Listando preços...')

    const prices = await stripe.prices.list({ active: true })

    console.log(`[Test] ${prices.data.length} preços ativos:`)
    prices.data.forEach((price) => {
      console.log(`  - ${price.id}`)
      console.log(`    Produto: ${price.product}`)
      console.log(`    Valor: ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`)
      console.log(`    Recorrência: ${price.recurring?.interval}`)
      console.log('')
    })

    return prices.data
  } catch (error) {
    console.error('[Test] Erro ao listar preços:', error)
    throw error
  }
}

/**
 * Menu principal
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  console.log('='.repeat(60))
  console.log('Stripe Webhook Test Script')
  console.log('='.repeat(60))
  console.log('')

  switch (command) {
    case 'checkout':
      await createTestCheckoutSession(args[1], args[2])
      break

    case 'subscribe':
      await createTestSubscription(args[1], args[2])
      break

    case 'pay':
      await payInvoice(args[1])
      break

    case 'cancel':
      await cancelSubscription(args[1])
      break

    case 'webhooks':
      await listWebhooks()
      break

    case 'prices':
      await listPrices()
      break

    default:
      console.log('Uso:')
      console.log('  node scripts/test-stripe-webhook.js checkout [email] [priceId]')
      console.log('  node scripts/test-stripe-webhook.js subscribe [email] [priceId]')
      console.log('  node scripts/test-stripe-webhook.js pay [invoiceId]')
      console.log('  node scripts/test-stripe-webhook.js cancel [subscriptionId]')
      console.log('  node scripts/test-stripe-webhook.js webhooks')
      console.log('  node scripts/test-stripe-webhook.js prices')
      console.log('')
      console.log('Exemplos:')
      console.log('  node scripts/test-stripe-webhook.js prices')
      console.log('  node scripts/test-stripe-webhook.js checkout test@example.com price_abc123')
  }
}

// Executar
main().catch(console.error)
