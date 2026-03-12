import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'

// Inicializar Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    })
  : null

export async function POST(request) {
  try {
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

    // Verificar se usuário tem customer ID no Stripe
    const customerId = user.subscription?.stripeCustomerId

    if (!customerId) {
      return Response.json(
        {
          error: 'Você não possui uma assinatura ativa. Assine um plano primeiro.',
          hasSubscription: false,
        },
        { status: 400 }
      )
    }

    // Criar sessão do portal do cliente
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
    })

    // Retornar URL do portal
    return Response.json({
      url: portalSession.url,
      hasSubscription: true,
    })
  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error)

    // Erro específico do Stripe quando não há subscription ativa
    if (error.type === 'StripeInvalidRequestError') {
      return Response.json(
        {
          error: 'Não foi possível acessar o portal de faturamento. Entre em contato com o suporte.',
          hasSubscription: false,
        },
        { status: 400 }
      )
    }

    return Response.json(
      {
        error: 'Erro ao acessar o portal de faturamento',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Endpoint para obter status da assinatura
export async function GET() {
  try {
    // Verificar sessão do usuário
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      )
    }

    // Buscar usuário com assinatura
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

    // Retornar informações da assinatura
    const subscription = user.subscription
    let subscriptionDetails = null

    if (subscription && subscription.stripeCustomerId && stripe) {
      try {
        // Buscar detalhes da assinatura no Stripe
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: subscription.stripeCustomerId,
          status: 'all',
          limit: 1,
        })

        if (stripeSubscriptions.data.length > 0) {
          const stripeSubscription = stripeSubscriptions.data[0]
          const price = stripeSubscription.items.data[0].price

          subscriptionDetails = {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            plan: {
              id: price.id,
              amount: price.unit_amount / 100,
              currency: price.currency.toUpperCase(),
              interval: price.recurring.interval,
              intervalCount: price.recurring.interval_count,
            },
          }
        }
      } catch (stripeError) {
        console.error('Erro ao buscar detalhes da assinatura no Stripe:', stripeError)
        // Continuar mesmo com erro, retornar dados do banco
      }
    }

    return Response.json({
      hasSubscription: !!subscription,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan,
            stripePriceId: subscription.stripePriceId,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            stripeDetails: subscriptionDetails,
          }
        : null,
    })
  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error)
    return Response.json(
      { error: 'Erro ao buscar status da assinatura' },
      { status: 500 }
    )
  }
}
