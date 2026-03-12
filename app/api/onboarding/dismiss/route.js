import { prisma } from '@/lib/prisma.js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingDismissed: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao dismiss onboarding:', error)
    return NextResponse.json({ error: 'Erro ao dismiss onboarding' }, { status: 500 })
  }
}
