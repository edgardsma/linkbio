import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route.js'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId } = body

    // Verificar se o usuário está tentando marcar o próprio onboarding
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Marcar onboarding como dismissible
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingDismissed: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao dismiss onboarding:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar onboarding' },
      { status: 500 }
    )
  }
}
