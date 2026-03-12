import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createCustomerPortalSession } from '@/lib/stripe-helpers'
import prisma from '@/lib/prisma'

/**
 * Cria uma sessão do portal de cliente Stripe
 * (para gerenciar assinatura, cancelar, etc.)
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
    const { returnUrl } = body

    // URL de retorno padrão
    const finalReturnUrl = returnUrl || `${process.env.NEXTAUTH_URL}/dashboard`

    // Verificar se usuário tem assinatura com customer ID
    if (!user.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 400 }
      )
    }

    // Criar sessão do portal
    const portalSession = await createCustomerPortalSession(
      user,
      finalReturnUrl
    )

    return NextResponse.json({
      url: portalSession.url,
    })
  } catch (error) {
    console.error('[Portal] Erro ao criar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão do portal' },
      { status: 500 }
    )
  }
}
