const Stripe = require('stripe')

/**
 * Cliente Stripe configurado
 * Use este módulo para interações com o Stripe em todo o projeto
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})

/**
 * Planos disponíveis e seus Price IDs
 * OBSERVAÇÃO: Você precisa criar estes preços no Dashboard do Stripe
 * e atualizar as variáveis de ambiente com os IDs reais
 */
const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Para quem está começando',
    monthly: {
      priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
      price: 19.90,
      currency: 'BRL',
    },
    annual: {
      priceId: process.env.STRIPE_PRICE_STARTER_ANNUAL,
      price: 199.00,
      currency: 'BRL',
      savings: '2 meses grátis',
    },
    features: [
      'Até 5 links',
      'Análises básicas',
      'Tema gratuito',
      'Suporte por email',
    ],
    limits: {
      maxLinks: 5,
      maxThemes: 1,
      analyticsLevel: 'basic',
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para criadores em crescimento',
    monthly: {
      priceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
      price: 49.90,
      currency: 'BRL',
    },
    annual: {
      priceId: process.env.STRIPE_PRICE_PRO_ANNUAL,
      price: 499.00,
      currency: 'BRL',
      savings: '2 meses grátis',
    },
    features: [
      'Links ilimitados',
      'Análises avançadas',
      'Todos os temas gratuitos',
      'Remoção de marca d\'água',
      'Suporte prioritário',
    ],
    limits: {
      maxLinks: Infinity,
      maxThemes: Infinity,
      analyticsLevel: 'advanced',
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Para profissionais e empresas',
    monthly: {
      priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      price: 99.90,
      currency: 'BRL',
    },
    annual: {
      priceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
      price: 999.00,
      currency: 'BRL',
      savings: '2 meses grátis',
    },
    features: [
      'Tudo do plano Pro',
      'Temas exclusivos premium',
      'Domínio personalizado',
      'Integrações avançadas',
      'API completa',
      'Suporte dedicado 24/7',
    ],
    limits: {
      maxLinks: Infinity,
      maxThemes: Infinity,
      analyticsLevel: 'premium',
      customDomain: true,
      apiAccess: true,
    },
  },
  free: {
    id: 'free',
    name: 'Gratuito',
    description: 'Plano básico gratuito',
    features: [
      'Até 3 links',
      'Análises básicas',
      'Tema gratuito',
    ],
    limits: {
      maxLinks: 3,
      maxThemes: 1,
      analyticsLevel: 'basic',
    },
  },
}

/**
 * Mapeamento de status do Stripe para nosso sistema
 */
const SUBSCRIPTION_STATUS = {
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
}

/**
 * Mapeamento de status do Stripe para nosso banco de dados
 */
const STATUS_MAP = {
  incomplete: 'pending',
  incomplete_expired: 'canceled',
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'past_due',
}

/**
 * Verifica se um plano é premium (pago)
 */
function isPremiumPlan(planId) {
  return ['starter', 'pro', 'premium'].includes(planId)
}

/**
 * Obtém informações de um plano pelo ID
 */
function getPlanById(planId) {
  return PLANS[planId] || PLANS.free
}

/**
 * Verifica se um usuário tem permissão baseada no plano
 */
function hasPermission(userPlan, feature) {
  const plan = getPlanById(userPlan)

  if (!plan.limits) {
    return false
  }

  switch (feature) {
    case 'customDomain':
      return plan.limits.customDomain === true
    case 'apiAccess':
      return plan.limits.apiAccess === true
    case 'advancedAnalytics':
      return ['advanced', 'premium'].includes(plan.limits.analyticsLevel)
    case 'unlimitedLinks':
      return plan.limits.maxLinks === Infinity
    default:
      return false
  }
}

/**
 * Calcula o número máximo de links permitidos por plano
 */
function getMaxLinksForPlan(planId) {
  const plan = getPlanById(planId)
  return plan.limits?.maxLinks || 3
}

/**
 * Verifica se o usuário pode adicionar mais links
 */
function canAddMoreLinks(userPlan, currentLinkCount) {
  const maxLinks = getMaxLinksForPlan(userPlan)
  return currentLinkCount < maxLinks
}

module.exports = {
  stripe,
  PLANS,
  SUBSCRIPTION_STATUS,
  STATUS_MAP,
  isPremiumPlan,
  getPlanById,
  hasPermission,
  getMaxLinksForPlan,
  canAddMoreLinks,
}
