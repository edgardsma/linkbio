/**
 * Configuração de preços e planos do Stripe
 *
 * NOTA: Os price IDs devem ser criados manualmente no dashboard do Stripe
 * e atualizados aqui.
 *
 * Para criar preços no Stripe:
 * 1. Acesse https://dashboard.stripe.com/products
 * 2. Crie um produto para cada plano (STARTER, PRO, ENTERPRISE)
 * 3. Crie preços para cada produto (mensal e anual)
 * 4. Copie os price IDs e atualize este arquivo
 */

const STRIPE_PRICES = {
  // Plano STARTER
  starter: {
    monthly: 'price_starter_1', // TODO: Atualizar com price ID real do Stripe
    yearly: 'price_starter_1_year', // TODO: Atualizar com price ID real do Stripe
  },

  // Plano PRO
  pro: {
    monthly: 'price_pro_1', // TODO: Atualizar com price ID real do Stripe
    yearly: 'price_pro_1_year', // TODO: Atualizar com price ID real do Stripe
  },

  // Plano ENTERPRISE
  enterprise: {
    monthly: 'price_enterprise_1', // TODO: Atualizar com price ID real do Stripe
    yearly: 'price_enterprise_1_year', // TODO: Atualizar com price ID real do Stripe
  },
}

/**
 * Informações dos planos para exibição
 */
const PLANS_INFO = {
  FREE: {
    name: 'Gratuito',
    description: 'Para começar sua jornada',
    price: 0,
    currency: 'BRL',
    billingCycle: 'monthly',
    features: [
      '5 links',
      'Tema básico',
      'Análises básicas',
      'Suporte por email',
    ],
    cta: 'Começar Grátis',
    limits: {
      links: 5,
      themes: ['default'],
      analytics: false,
      customDomain: false,
    },
  },
  STARTER: {
    name: 'Starter',
    description: 'Para criadores em crescimento',
    price: 19.90,
    currency: 'BRL',
    billingCycle: 'monthly',
    priceYearly: 199.90,
    discountYearly: 17,
    features: [
      '15 links',
      '3 temas premium',
      'Análises completas',
      'Suporte prioritário',
      'Remove anúncios',
    ],
    cta: 'Assinar Starter',
    limits: {
      links: 15,
      themes: ['default', 'modern', 'minimal'],
      analytics: true,
      customDomain: false,
    },
  },
  PRO: {
    name: 'Pro',
    description: 'Para profissionais',
    price: 49.90,
    currency: 'BRL',
    billingCycle: 'monthly',
    priceYearly: 499.90,
    discountYearly: 17,
    features: [
      '50 links',
      '10 temas premium',
      'Análises avançadas',
      'Domínio personalizado',
      'API de integração',
      'Suporte 24/7',
    ],
    cta: 'Assinar Pro',
    limits: {
      links: 50,
      themes: ['default', 'modern', 'minimal', 'bold', 'elegant'],
      analytics: true,
      customDomain: true,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Para grandes negócios',
    price: 149.90,
    currency: 'BRL',
    billingCycle: 'monthly',
    priceYearly: 1499.90,
    discountYearly: 17,
    features: [
      'Links ilimitados',
      'Todos os temas',
      'Análises completas',
      'Domínio personalizado',
      'API completa',
      'SLA garantido',
      'Suporte dedicado',
      'White-label',
    ],
    cta: 'Falar com Vendas',
    limits: {
      links: -1, // -1 = ilimitado
      themes: ['all'],
      analytics: true,
      customDomain: true,
    },
  },
}

/**
 * Obtém o price ID do Stripe para um plano e ciclo de cobrança
 */
function getPriceId(plan, billingCycle = 'monthly') {
  const planKey = plan.toLowerCase()
  if (STRIPE_PRICES[planKey] && STRIPE_PRICES[planKey][billingCycle]) {
    return STRIPE_PRICES[planKey][billingCycle]
  }
  return null
}

/**
 * Obtém informações de um plano
 */
function getPlanInfo(plan) {
  return PLANS_INFO[plan] || PLANS_INFO.FREE
}

/**
 * Obtém todos os planos disponíveis
 */
function getAllPlans() {
  return Object.keys(PLANS_INFO)
}

/**
 * Calcula o desconto anual em porcentagem
 */
function calculateYearlyDiscount(monthlyPrice, yearlyPrice) {
  const monthlyTotal = monthlyPrice * 12
  const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100
  return Math.round(discount)
}

module.exports = {
  STRIPE_PRICES,
  PLANS_INFO,
  getPriceId,
  getPlanInfo,
  getAllPlans,
  calculateYearlyDiscount,
  default: STRIPE_PRICES,
}
