import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route.js'
import { getOnboardingStatus } from '@/lib/onboarding.js'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar usuário completo com dados necessários
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: true,
        links: { orderBy: { position: 'asc' } },
        subscription: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Calcular status de onboarding
    const onboarding = await getOnboardingStatus({ user })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        image: user.image,
        bio: user.bio,
        themeId: user.themeId,
        onboardingDismissed: user.onboardingDismissed,
      },
      subscription: {
        plan: user.subscription?.plan || 'free',
        status: user.subscription?.status || 'inactive',
      },
      onboarding,
    })
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    )
  }
}
