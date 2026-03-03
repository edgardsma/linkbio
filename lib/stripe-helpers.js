const prisma = require('@/lib/prisma.js')

// Lazy loading do Stripe para evitar erros quando não há chave
let stripe = null

function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    const Stripe = require('stripe')
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    })
  }
  return stripe
}

// Mapeamento de planos Stripe para planos do sistema
const PLAN_MAPPING = {
  'price_starter_1': 'STARTER',
  'price_starter_1_year': 'STARTER',
  'price_pro_1': 'PRO',
  'price_pro_1_year': 'PRO',
  'price_premium_1': 'PREMIUM',
  'price_premium_1_year': 'PREMIUM',
}

// Limite de links por plano
const PLAN_LIMITS = {
  FREE: { links: 3, themes: ['default'], analytics: 'basic', customDomain: false },
  STARTER: { links: 5, themes: ['default', 'modern', 'minimal'], analytics: 'basic', customDomain: false },
  PRO: { links: -1, themes: ['all'], analytics: 'advanced', customDomain: false }, // -1 = ilimitado
  PREMIUM: { links: -1, themes: ['all'], analytics: 'premium', customDomain: true, apiAccess: true },
}

/**
 * Obtém o plano a partir do price ID do Stripe
 */
function getPlanFromPriceId(priceId) {
  return PLAN_MAPPING[priceId] || 'STARTER'
}

/**
 * Obtém informações detalhadas do plano
 */
function getPlanDetails(plan) {
  const planLower = plan?.toLowerCase() || 'free'
  const details = {
    free: {
      name: 'Gratuito',
      price: 0,
      currency: 'BRL',
      features: ['Até 3 links', 'Análises básicas', 'Tema gratuito'],
    },
    starter: {
      name: 'Starter',
      price: 19.90,
      currency: 'BRL',
      features: ['Até 5 links', 'Análises básicas', '3 temas gratuitos', 'Suporte por email'],
    },
    pro: {
      name: 'Pro',
      price: 49.90,
      currency: 'BRL',
      features: ['Links ilimitados', 'Análises avançadas', 'Todos os temas', 'Remoção de marca d\'água', 'Suporte prioritário'],
    },
    premium: {
      name: 'Premium',
      price: 99.90,
      currency: 'BRL',
      features: ['Tudo do plano Pro', 'Temas exclusivos', 'Domínio personalizado', 'Integrações avançadas', 'API completa', 'Suporte 24/7'],
    },
  }

  return details[planLower] || details.free
}

/**
 * Verifica se um plano é premium
 */
function isPremiumPlan(plan) {
  const planLower = plan?.toLowerCase() || 'free'
  return ['starter', 'pro', 'premium'].includes(planLower)
}

/**
 * Obtém o price ID do Stripe para um plano
 */
function getPriceIdForPlan(plan, billingCycle = 'monthly') {
  const suffix = billingCycle === 'yearly' ? '_year' : '_1'
  const basePrice = `price_${plan.toLowerCase()}${suffix}`
  return PLAN_MAPPING[basePrice] ? basePrice : null
}

/**
 * Busca usuário por customer ID do Stripe
 */
async function getUserByStripeCustomerId(customerId) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  })

  return subscription?.user
}

/**
 * Cria um cliente no Stripe para o usuário
 */
async function createStripeCustomer(user) {
  const stripeClient = getStripe()
  if (!stripeClient) {
    throw new Error('Stripe não configurado')
  }

  try {
    const customer = await stripeClient.customers.create({
      email: user.email,
      name: user.name || user.username,
      metadata: {
        userId: user.id,
        username: user.username,
      },
    })

    return customer
  } catch (error) {
    console.error('[Stripe] Erro ao criar cliente:', error)
    throw error
  }
}

/**
 * Cria ou obtém o cliente Stripe do usuário
 */
async function getOrCreateStripeCustomer(user) {
  const stripeClient = getStripe()
  if (!stripeClient) {
    throw new Error('Stripe não configurado')
  }

  // Buscar assinatura existente
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (subscription?.stripeCustomerId) {
    try {
      return await stripeClient.customers.retrieve(subscription.stripeCustomerId)
    } catch (error) {
      console.error('[Stripe] Erro ao buscar cliente:', error)
    }
  }

  // Criar novo cliente
  return await createStripeCustomer(user)
}

/**
 * Cria uma sessão de checkout do Stripe
 */
async function createCheckoutSession(user, priceId, successUrl, cancelUrl) {
  const stripeClient = getStripe()
  if (!stripeClient) {
    throw new Error('Stripe não configurado')
  }

  const customer = await getOrCreateStripeCustomer(user)

  const session = await stripeClient.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: user.id,
      price_id: priceId,
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  })

  return session
}

/**
 * Cria uma sessão de portal do cliente (para gerenciar assinatura)
 */
async function createCustomerPortalSession(user, returnUrl) {
  const stripeClient = getStripe()
  if (!stripeClient) {
    throw new Error('Stripe não configurado')
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (!subscription?.stripeCustomerId) {
    throw new Error('Cliente Stripe não encontrado')
  }

  const session = await stripeClient.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Cancela uma assinatura (mas mantém ativa até o fim do período)
 */
async function cancelSubscription(userId) {
  const stripeClient = getStripe()
  if (!stripeClient) {
    throw new Error('Stripe não configurado')
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription?.stripeCustomerId) {
    throw new Error('Assinatura não encontrada')
  }

  // Listar assinaturas do cliente
  const stripeSubscriptions = await stripeClient.subscriptions.list({
    customer: subscription.stripeCustomerId,
    limit: 1,
  })

  if (stripeSubscriptions.data.length === 0) {
    throw new Error('Assinatura Stripe não encontrada')
  }

  const stripeSubscription = stripeSubscriptions.data[0]

  // Cancelar no final do período
  await stripeClient.subscriptions.update(stripeSubscription.id, {
    cancel_at_period_end: true,
  })

  // Atualizar no banco
  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
    },
  })

  return { success: true }
}

/**
 * Verifica se o usuário pode adicionar mais links
 */
async function canAddLinks(userId, currentLinksCount) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const plan = subscription?.plan || 'FREE'
  const limit = PLAN_LIMITS[plan]?.links || PLAN_LIMITS.FREE.links

  return limit === -1 || currentLinksCount < limit
}

/**
 * Obtém o limite de links para um plano
 */
function getLinksLimit(plan) {
  const planUpper = plan?.toUpperCase() || 'FREE'
  return PLAN_LIMITS[planUpper]?.links || PLAN_LIMITS.FREE.links
}

/**
 * Verifica se o usuário atingiu o limite de links
 */
async function hasReachedLinkLimit(userId) {
  const [subscription, linkCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
    }),
    prisma.link.count({
      where: { userId, isActive: true },
    }),
  ])

  const plan = subscription?.plan || 'FREE'
  const limit = getLinksLimit(plan)

  return limit !== -1 && linkCount >= limit
}

/**
 * Verifica se o usuário tem acesso a uma feature específica
 */
async function hasFeatureAccess(userId, feature) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const plan = subscription?.plan || 'FREE'
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE

  switch (feature) {
    case 'customDomain':
      return limits.customDomain === true
    case 'apiAccess':
      return limits.apiAccess === true
    case 'advancedAnalytics':
      return ['advanced', 'premium'].includes(limits.analytics)
    case 'unlimitedLinks':
      return limits.links === -1
    case 'allThemes':
      return limits.themes.includes('all')
    default:
      return false
  }
}

/**
 * Verifica se o usuário pode usar um tema específico
 */
async function canUseTheme(userId, themeName) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const plan = subscription?.plan || 'FREE'
  const allowedThemes = PLAN_LIMITS[plan].themes

  return allowedThemes.includes('all') || allowedThemes.includes(themeName)
}

/**
 * Obtém informações da assinatura do usuário
 */
async function getSubscriptionInfo(userId) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription) {
    return {
      plan: 'FREE',
      status: 'active',
      limits: PLAN_LIMITS.FREE,
    }
  }

  let stripeSubscription = null
  if (subscription.stripeCustomerId) {
    const stripeClient = getStripe()
    if (stripeClient) {
      try {
        const stripeSubscriptions = await stripeClient.subscriptions.list({
          customer: subscription.stripeCustomerId,
          limit: 1,
        })
        stripeSubscription = stripeSubscriptions.data[0] || null
      } catch (error) {
        console.error('[Stripe] Erro ao buscar subscription:', error)
      }
    }
  }

  return {
    plan: subscription.plan,
    status: subscription.status,
    stripeStatus: stripeSubscription?.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
    limits: PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.FREE,
  }
}

/**
 * Downgrade usuário para plano FREE
 */
async function downgradeToFree(userId) {
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'canceled',
      plan: 'FREE',
      stripeCustomerId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  })

  // TODO: Remover features premium
  // - Desativar domínio customizado
  // - Reverter para tema padrão
  // - Enviar email de downgrade
}

/**
 * Calcula dias restantes até o fim do período
 */
function getDaysRemaining(subscription) {
  if (!subscription || !subscription.currentPeriodEnd) {
    return null
  }

  const now = new Date()
  const periodEnd = new Date(subscription.currentPeriodEnd)
  const diffTime = periodEnd - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Processa eventos do webhook do Stripe
 */
async function handleStripeEvent(event) {
  const eventType = event.type

  switch (eventType) {
    case 'checkout.session.completed':
      return await handleCheckoutSessionCompleted(event.data.object)
    case 'customer.subscription.created':
      return await handleSubscriptionCreated(event.data.object)
    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(event.data.object)
    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(event.data.object)
    case 'invoice.payment_succeeded':
      return await handleInvoicePaymentSucceeded(event.data.object)
    case 'invoice.payment_failed':
      return await handleInvoicePaymentFailed(event.data.object)
    default:
      console.log(`Evento não tratado: ${eventType}`)
      return { received: true }
  }
}

/**
 * Handler para checkout.session.completed
 */
async function handleCheckoutSessionCompleted(session) {
  const { userId } = session.metadata

  if (!userId) {
    console.error('userId não encontrado nos metadados')
    return { error: 'userId não encontrado' }
  }

  // Salvar customer ID
  if (session.customer) {
    await prisma.subscription.update({
      where: { userId },
      data: { stripeCustomerId: session.customer },
    })
  }

  console.log(`Checkout completado para usuário: ${userId}`)
  return { success: true }
}

/**
 * Handler para customer.subscription.created
 */
async function handleSubscriptionCreated(subscription) {
  const { userId, plan } = subscription.metadata

  if (!userId) {
    console.error('userId não encontrado nos metadados')
    return { error: 'userId não encontrado' }
  }

  const planName = PLAN_MAPPING[subscription.items.data[0].price.id] || plan || 'STARTER'
  const statusMap = {
    incomplete: 'pending',
    incomplete_expired: 'canceled',
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: subscription.customer,
      stripePriceId: subscription.items.data[0].price.id,
      status: statusMap[subscription.status] || 'pending',
      plan: planName,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripeCustomerId: subscription.customer,
      stripePriceId: subscription.items.data[0].price.id,
      status: statusMap[subscription.status] || 'pending',
      plan: planName,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  console.log(`Assinatura criada: ${subscription.id}, plano: ${planName}`)
  return { success: true }
}

/**
 * Handler para customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer

  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSubscription) {
    console.error('Assinatura não encontrada para customer:', customerId)
    return { error: 'Assinatura não encontrada' }
  }

  const planName = PLAN_MAPPING[subscription.items.data[0].price.id] || existingSubscription.plan
  const statusMap = {
    incomplete: 'pending',
    incomplete_expired: 'canceled',
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: statusMap[subscription.status] || 'pending',
      plan: planName,
      stripePriceId: subscription.items.data[0].price.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  console.log(`Assinatura atualizada: ${subscription.id}`)
  return { success: true }
}

/**
 * Handler para customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer

  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSubscription) {
    console.error('Assinatura não encontrada para customer:', customerId)
    return { error: 'Assinatura não encontrada' }
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: 'canceled',
      plan: 'FREE',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  console.log(`Assinatura cancelada: ${subscription.id}`)
  return { success: true }
}

/**
 * Handler para invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice) {
  const customerId = invoice.customer

  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSubscription) {
    console.error('Assinatura não encontrada para customer:', customerId)
    return { error: 'Assinatura não encontrada' }
  }

  if (invoice.subscription) {
    const stripeClient = getStripe()
    if (stripeClient) {
      const subscription = await stripeClient.subscriptions.retrieve(invoice.subscription)

      const statusMap = {
        incomplete: 'pending',
        incomplete_expired: 'canceled',
        trialing: 'trialing',
        active: 'active',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
      }

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: statusMap[subscription.status] || 'active',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })
    }
  }

  console.log(`Pagamento bem-sucedido: ${invoice.id}`)
  return { success: true }
}

/**
 * Handler para invoice.payment_failed
 */
async function handleInvoicePaymentFailed(invoice) {
  const customerId = invoice.customer

  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSubscription) {
    console.error('Assinatura não encontrada para customer:', customerId)
    return { error: 'Assinatura não encontrada' }
  }

  if (invoice.subscription) {
    const stripeClient = getStripe()
    if (stripeClient) {
      const subscription = await stripeClient.subscriptions.retrieve(invoice.subscription)

      const statusMap = {
        incomplete: 'pending',
        incomplete_expired: 'canceled',
        trialing: 'trialing',
        active: 'active',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
      }

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: statusMap[subscription.status] || 'past_due',
        },
      })
    }
  }

  console.log(`Pagamento falhou: ${invoice.id}`)
  return { success: true }
}

/**
 * Atualiza assinatura no banco após evento do webhook
 */
async function updateSubscriptionInDb(customerId, updates) {
  return await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: updates,
  })
}

module.exports = {
  PLAN_MAPPING,
  PLAN_LIMITS,
  getPlanFromPriceId,
  getPlanDetails,
  isPremiumPlan,
  getPriceIdForPlan,
  getUserByStripeCustomerId,
  createStripeCustomer,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createCustomerPortalSession,
  cancelSubscription,
  canAddLinks,
  getLinksLimit,
  hasReachedLinkLimit,
  hasFeatureAccess,
  canUseTheme,
  getSubscriptionInfo,
  downgradeToFree,
  getDaysRemaining,
  handleStripeEvent,
  updateSubscriptionInDb,
  getStripe,
}
