import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'

// PATCH - Atualizar link curto
export async function PATCH(request, { params }) {
  const requestId = getRequestId(request)
  const { id } = params

  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { originalUrl, slug } = body

    // Verificar se o link pertence ao usuário
    const existingLink = await prisma.shortLink.findUnique({
      where: { id }
    })

    if (!existingLink) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    if (existingLink.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Validar URL se fornecida
    if (originalUrl) {
      try {
        new URL(originalUrl)
      } catch {
        return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
      }
    }

    // Validar slug se fornecido
    if (slug && slug !== existingLink.slug) {
      if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Slug deve conter apenas letras, números, hífens e underscores' },
          { status: 400 }
        )
      }

      // Verificar se slug já existe
      const slugExists = await prisma.shortLink.findUnique({
        where: { slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug já está em uso' },
          { status: 409 }
        )
      }
    }

    // Atualizar link
    const updatedLink = await prisma.shortLink.update({
      where: { id },
      data: {
        ...(originalUrl && { originalUrl }),
        ...(slug && { slug })
      }
    })

    const shortUrlBase = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    logger.info('Link curto atualizado', {
      requestId,
      userId: session.user.id,
      shortLinkId: id
    })

    return NextResponse.json({
      ...updatedLink,
      shortUrl: `${shortUrlBase}/s/${updatedLink.slug}`
    })

  } catch (error) {
    logger.error('Erro ao atualizar link curto', error, { requestId, id })
    return NextResponse.json({ error: 'Erro ao atualizar link' }, { status: 500 })
  }
}

// DELETE - Excluir link curto
export async function DELETE(request, { params }) {
  const requestId = getRequestId(request)
  const { id } = params

  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se o link pertence ao usuário
    const existingLink = await prisma.shortLink.findUnique({
      where: { id }
    })

    if (!existingLink) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    if (existingLink.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Excluir link
    await prisma.shortLink.delete({
      where: { id }
    })

    logger.info('Link curto excluído', {
      requestId,
      userId: session.user.id,
      shortLinkId: id
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('Erro ao excluir link curto', error, { requestId, id })
    return NextResponse.json({ error: 'Erro ao excluir link' }, { status: 500 })
  }
}
