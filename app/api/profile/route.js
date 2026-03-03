import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

// Buscar perfil do usuário
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
        background: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
  }
}

// Atualizar perfil do usuário
export async function PATCH(request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { name, username, bio, image, background } = body

    // Validações
    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Nome de usuário inválido. Use apenas letras, números, hífens e sublinhados.' },
        { status: 400 }
      )
    }

    // Verificar se o username já está em uso (se estiver sendo alterado)
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Este nome de usuário já está em uso' },
          { status: 400 }
        )
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(image !== undefined && { image }),
        ...(background !== undefined && { background }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
        background: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
