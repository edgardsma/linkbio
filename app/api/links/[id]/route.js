import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

// Atualizar link
export async function PATCH(request, { params }) {
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

    const linkId = params.id
    const body = await request.json()
    const { title, url, description, icon, position, isActive } = body

    // Verificar se o link pertence ao usuário
    const existingLink = await prisma.link.findFirst({
      where: {
        id: linkId,
        userId: user.id,
      },
    })

    if (!existingLink) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    // Atualizar link
    const link = await prisma.link.update({
      where: { id: linkId },
      data: {
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(position !== undefined && { position }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(link)
  } catch (error) {
    console.error('Erro ao atualizar link:', error)
    return NextResponse.json({ error: 'Erro ao atualizar link' }, { status: 500 })
  }
}

// Deletar link
export async function DELETE(request, { params }) {
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

    const linkId = params.id

    // Verificar se o link pertence ao usuário
    const existingLink = await prisma.link.findFirst({
      where: {
        id: linkId,
        userId: user.id,
      },
    })

    if (!existingLink) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    // Deletar link
    await prisma.link.delete({
      where: { id: linkId },
    })

    // Reordenar links restantes
    const remainingLinks = await prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' },
    })

    for (let i = 0; i < remainingLinks.length; i++) {
      await prisma.link.update({
        where: { id: remainingLinks[i].id },
        data: { position: i },
      })
    }

    return NextResponse.json({ message: 'Link deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar link:', error)
    return NextResponse.json({ error: 'Erro ao deletar link' }, { status: 500 })
  }
}
