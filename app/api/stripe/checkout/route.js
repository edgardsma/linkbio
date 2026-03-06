import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'

// Inicializar Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    })
  : null

// Mapeamento de planos para Price IDs do Stripe
// OBSERVAÇÃO: Você precisa criar estes preços no Dashboard do Stripe
// e substituir os IDs abaixo pelos seus price IDs reais
const PLANS = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly_id',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual_id',
    name: 'Starter',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_id',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual_id',
    name: 'Pro',
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly_id',
    annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || 'price_premium_annual_id',
    name: 'Premium',
  },
}

export async function POST(request) {
  try {
    // Verificar se o Stripe está configurado
    if (!stripe) {
      return Response.json(
        { error: 'Stripe não está configurado. Configure STRIPE_SECRET_KEY no .env' },
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

    if (!PLANS[plan] || !PLANS[plan][billingCycle]) {
      return Response.json(
        { error: 'Plano ou ciclo de faturamento inválido' },
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

    // Verificar se já tem assinatura ativa
    if (user.subscription) {
      // Se já tem assinatura ativa do mesmo plano
      if (user.subscription.status === 'active' && user.subscription.plan === plan) {
        return Response.json(
          { error: 'Você já possui uma assinatura ativa deste plano' },
          { status: 400 }
        )
      }

      // Se está tentando fazer upgrade/downgrade, permitir
      // O webhook vai atualizar a assinatura automaticamente
    }

    // Obter price ID do plano solicitado
    const priceId = PLANS[plan][billingCycle]
    const planName = PLANS[plan].name

    // Criar ou recuperar customer do Stripe
    let customerId = user.subscription?.stripeCustomerId

    if (!customerId) {
      // Criar novo customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
          username: user.username,
        },
      })
      customerId = customer.id

      // Salvar customer ID no banco de dados
      if (user.subscription) {
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { stripeCustomerId: customerId },
        })
      } else {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: customerId,
            status: 'pending',
            plan: 'free',
          },
        })
      }
    }

    // Criar sessão de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/plans?canceled=true`,
      allow_promotion_codes: true,
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        userId: user.id,
        username: user.username,
        plan: plan,
        billingCycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          username: user.username,
          plan: plan,
          billingCycle: billingCycle,
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
  try {
    return Response.json({
      plans: {
        starter: {
          name: 'Starter',
          monthly: {
            price: 19.90,
            currency: 'BRL',
            priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
          },
          annual: {
            price: 199.00,
            currency: 'BRL',
            savings: '2 meses grátis',
            priceId: process.env.STRIPE_PRICE_STARTER_ANNUAL,
          },
          features: [
            'Até 5 links',
            'Análises básicas',
            'Tema gratuito',
            'Suporte por email',
          ],
        },
        pro: {
          name: 'Pro',
          monthly: {
            price: 49.90,
            currency: 'BRL',
            priceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
          },
          annual: {
            price: 499.00,
            currency: 'BRL',
            savings: '2 meses grátis',
            priceId: process.env.STRIPE_PRICE_PRO_ANNUAL,
          },
          features: [
            'Links ilimitados',
            'Análises avançadas',
            'Todos os temas gratuitos',
            'Remoção de marca d\'água',
            'Suporte prioritário',
          ],
        },
        premium: {
          name: 'Premium',
          monthly: {
            price: 99.90,
            currency: 'BRL',
            priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
          },
          annual: {
            price: 999.00,
            currency: 'BRL',
            savings: '2 meses grátis',
            priceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
          },
          features: [
            'Tudo do plano Pro',
            'Temas exclusivos premium',
            'Domínio personalizado',
            'Integrações avançadas',
            'API completa',
            'Suporte dedicado 24/7',
          ],
        },
      },
    })
  } catch (error) {
    console.error('Erro ao obter planos:', error)
    return Response.json(
      { error: 'Erro ao obter informações dos planos' },
      { status: 500 }
    )
  }
}
