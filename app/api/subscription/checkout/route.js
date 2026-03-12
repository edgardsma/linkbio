import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  createCheckoutSession,
  getOrCreateStripeCustomer,
  getSubscriptionInfo,
} from '@/lib/stripe-helpers'

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { priceId, successUrl, cancelUrl } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'price_id é obrigatório' },
        { status: 400 }
      )
    }

    // URLs padrão se não fornecidas
    const finalSuccessUrl = successUrl || `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`
    const finalCancelUrl = cancelUrl || `${process.env.NEXTAUTH_URL}/pricing?checkout=canceled`

    // Criar sessão de checkout
    const checkoutSession = await createCheckoutSession(
      user,
      priceId,
      finalSuccessUrl,
      finalCancelUrl
    )

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error) {
    console.error('[Checkout] Erro ao criar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}

/**
 * Obtém informações da assinatura atual do usuário
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const subscriptionInfo = await getSubscriptionInfo(user.id)

    return NextResponse.json(subscriptionInfo)
  } catch (error) {
    console.error('[Subscription] Erro ao buscar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assinatura' },
      { status: 500 }
    )
  }
}
