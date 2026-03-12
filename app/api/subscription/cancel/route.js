import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { cancelSubscription } from '@/lib/stripe-helpers'
import prisma from '@/lib/prisma'

/**
 * Cancela a assinatura do usuário
 * (mantém ativa até o fim do período atual)
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

    // Verificar se tem assinatura ativa
    if (!user.subscription || user.subscription.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 400 }
      )
    }

    // Cancelar assinatura
    await cancelSubscription(user.id)

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      willEndAt: user.subscription.currentPeriodEnd,
    })
  } catch (error) {
    console.error('[Cancel] Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
}
