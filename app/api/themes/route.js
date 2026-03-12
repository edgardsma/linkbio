import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma.js'

// Listar temas disponíveis
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    // Buscar todos os temas
    const themes = await prisma.theme.findMany({
      orderBy: [
        { isPremium: 'asc' },
        { name: 'asc' },
      ],
    })

    // Se usuário estiver logado, retornar tema atual
    let currentTheme = null
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { theme: true },
      })

      if (user?.theme) {
        currentTheme = user.theme
      } else if (user) {
        // Retornar tema atual customizado
        currentTheme = {
          name: 'custom',
          isPremium: false,
          primaryColor: user.primaryColor,
          secondaryColor: user.secondaryColor,
          backgroundColor: user.backgroundColor,
          textColor: user.textColor,
        }
      }
    }

    return NextResponse.json({
      themes,
      currentTheme,
    })
  } catch (error) {
    console.error('Erro ao buscar temas:', error)
    return NextResponse.json({ error: 'Erro ao buscar temas' }, { status: 500 })
  }
}
