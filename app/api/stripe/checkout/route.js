import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { getStripeConfig, getBaseUrl } from '@/lib/stripe-config'

export async function POST(request) {
  const config = getStripeConfig()

  // Verificar se o Stripe está configurado
  if (!config.configured) {
    return Response.json(
      {
        error: config.message,
        development: process.env.NODE_ENV === 'development',
      },
      { status: 503 }
    )
  }

  // Verificar sessão do usuário
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return Response.json(
      { error: 'Não autorizado. Faça login para continuar.' },
      { status: 401 }
    )
  }

  // Obter dados do corpo da requisição
  const body = await request.json()
  const { plan, billingCycle } = body

  // Validar plano e ciclo de faturamento
  if (!plan || !billingCycle) {
    return Response.json(
      { error: 'Plano e ciclo de faturamento são obrigatórios' },
      { status: 400 }
    )
  }

  // Validar planos válidos
  const validPlans = ['starter', 'pro', 'premium']
  if (!validPlans.includes(plan)) {
    return Response.json(
      { error: 'Plano inválido. Planos disponíveis: starter, pro, premium' },
      { status: 400 }
    )
  }

  const validCycles = ['monthly', 'annual']
  if (!validCycles.includes(billingCycle)) {
    return Response.json(
      { error: 'Ciclo de faturamento inválido. Use: monthly ou annual' },
      { status: 400 }
    )
  }

  // Buscar usuário no banco de dados
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  })

  if (!user) {
    return Response.json(
      { error: 'Usuário não encontrado' },
      { status: 404 }
    )
  }

  try {
    // Obter price ID do plano
    const priceId = plan === 'starter'
      ? billingCycle === 'monthly'
        ? process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly'
        : process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual'
      : plan === 'pro'
      ? billingCycle === 'monthly'
        ? process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly'
        : process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual'
      : plan === 'premium'
      ? billingCycle === 'monthly'
        ? process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly'
        : process.env.STRIPE_PRICE_PREMIUM_ANNUAL || 'price_premium_annual'
      : null

    if (!priceId) {
      return Response.json(
        { error: 'Price ID não configurado para este plano. Configure as variáveis de ambiente.' },
        { status: 500 }
      )
    }

    // Criar ou recuperar customer do Stripe
    let customerId = user.subscription?.stripeCustomerId

    if (!customerId) {
      const customer = await config.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
          username: user.username,
        },
      })
      customerId = customer.id

      // Salvar customer ID no banco de dados
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Criar sessão de checkout
    const baseUrl = getBaseUrl()
    const checkoutSession = await config.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/plans?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/plans?canceled=true`,
      allow_promotion_codes: true,
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        userId: user.id,
        username: user.username,
        plan,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          username: user.username,
          plan,
          billingCycle,
        },
      },
    })

    // Retornar URL do checkout
    return Response.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return Response.json(
      {
        error: 'Erro ao criar sessão de checkout',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Endpoint para obter informações dos planos disponíveis
export async function GET() {
  const config = getStripeConfig()

  if (!config.configured) {
    // Retornar informações dos planos sem preço (Stripe não configurado)
    return Response.json({
      configured: false,
      message: config.message,
      development: process.env.NODE_ENV === 'development',
      plans: {
        free: {
          name: 'FREE',
          description: 'Para começar sua jornada',
          monthly: { price: 0, savings: null },
          annual: { price: 0, savings: null },
          features: [
            'Até 5 links',
            'Análises básicas de cliques',
            '1 tema pré-definido',
            'Suporte por email',
            'QR Code padrão',
          ],
          cta: 'Começar Grátis',
          stripePriceId: null,
        },
        starter: {
          name: 'STARTER',
          description: 'Ideal para criadores em crescimento',
          monthly: { price: 19.90, savings: null },
          annual: { price: 199.90, savings: 'Economize R$ 40' },
          features: [
            'Até 15 links',
            'Análises completas de cliques',
            '5 temas personalizáveis',
            'Suporte prioritário',
            'QR Code personalizado',
            'Sem marca d\'água',
          ],
          cta: 'Assinar Starter',
          stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || null,
          stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL || null,
        },
        pro: {
          name: 'PRO',
          description: 'Para profissionais e negócios',
          monthly: { price: 49.90, savings: null },
          annual: { price: 499.90, savings: 'Economize R$ 100' },
          features: [
            'Links ilimitados',
            'Análises avançadas',
            'Customização completa',
            'Domínio personalizado',
            'Suporte 24/7',
            'API básica',
            'Remoção de marca',
            'Todos os temas gratuitos',
          ],
          cta: 'Assinar PRO',
          stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
          stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || null,
        },
        premium: {
          name: 'PREMIUM',
          description: 'Para grandes empresas',
          monthly: { price: 99.90, savings: null },
          annual: { price: 999.90, savings: 'Economize R$ 200' },
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
          ],
          cta: 'Assinar PREMIUM',
          stripePriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || null,
          stripePriceIdAnnual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || null,
        },
      },
    })
  }

  return Response.json({
    configured: true,
    message: config.message,
    development: process.env.NODE_ENV === 'development',
    plans: {
      free: {
        name: 'FREE',
        description: 'Para começar sua jornada',
        monthly: { price: 0, savings: null },
        annual: { price: 0, savings: null },
        features: [
          'Até 5 links',
          'Análises básicas de cliques',
          '1 tema pré-definido',
          'Suporte por email',
          'QR Code padrão',
        ],
        cta: 'Começar Grátis',
        stripePriceId: null,
      },
      starter: {
        name: 'STARTER',
        description: 'Ideal para criadores em crescimento',
        monthly: { price: 19.90, savings: null },
        annual: { price: 199.90, savings: 'Economize R$ 40' },
        features: [
          'Até 15 links',
          'Análises completas de cliques',
          '5 temas personalizáveis',
          'Suporte prioritário',
          'QR Code personalizado',
          'Sem marca d\'água',
        ],
        cta: 'Assinar Starter',
        stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || null,
        stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL || null,
      },
      pro: {
        name: 'PRO',
        description: 'Para profissionais e negócios',
        monthly: { price: 49.90, savings: null },
        annual: { price: 499.90, savings: 'Economize R$ 100' },
        features: [
          'Links ilimitados',
          'Análises avançadas',
          'Customização completa',
          'Domínio personalizado',
          'Suporte 24/7',
          'API básica',
          'Remoção de marca',
          'Todos os temas gratuitos',
        ],
        cta: 'Assinar PRO',
        stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
        stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || null,
      },
      premium: {
        name: 'PREMIUM',
        description: 'Para grandes empresas',
        monthly: { price: 99.90, savings: null },
        annual: { price: 999.90, savings: 'Economize R$ 200' },
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
        ],
        cta: 'Assinar PREMIUM',
        stripePriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || null,
        stripePriceIdAnnual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || null,
      },
    },
  })
}
