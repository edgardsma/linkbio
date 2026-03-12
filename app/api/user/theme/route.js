import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// Atualizar tema do usuário
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { themeId, primaryColor, secondaryColor, backgroundColor, textColor } = body

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se themeId for fornecido, usar tema predefinido
    if (themeId) {
      const theme = await prisma.theme.findUnique({
        where: { id: themeId },
      })

      if (!theme) {
        return NextResponse.json({ error: 'Tema não encontrado' }, { status: 404 })
      }

      // Verificar se é premium e usuário tem plano premium
      if (theme.isPremium) {
        const subscription = await prisma.subscription.findUnique({
          where: { userId: user.id },
        })

        const hasPremiumPlan = subscription?.plan === 'pro' || subscription?.plan === 'premium'

        if (!hasPremiumPlan && subscription?.plan !== 'starter') {
          return NextResponse.json(
            { error: 'Este tema requer um plano premium ou superior' },
            { status: 403 }
          )
        }
      }

      // Atualizar usuário com tema predefinido
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          themeId: themeId,
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
        },
      })

      return NextResponse.json(updated)
    }

    // Se cores são fornecidas (tema customizado)
    if (primaryColor || secondaryColor || backgroundColor || textColor) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          themeId: null, // Remove tema predefinido
          primaryColor: primaryColor || user.primaryColor,
          secondaryColor: secondaryColor || user.secondaryColor,
          backgroundColor: backgroundColor || user.backgroundColor,
          textColor: textColor || user.textColor,
        },
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Nenhum dado fornecido' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao atualizar tema:', error)
    return NextResponse.json({ error: 'Erro ao atualizar tema' }, { status: 500 })
  }
}
