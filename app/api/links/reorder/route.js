import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { requireAuth } from '@/lib/auth.js'
import { apiLogger } from '@/lib/logger.js'

/**
 * Endpoint para reordenar links
 * Atualiza a posição de múltiplos links de uma vez
 */
export async function PATCH(request) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { links } = body

    // Validação básica
    if (!links || !Array.isArray(links)) {
      return NextResponse.json(
        { error: 'Formato inválido. Esperado: { links: [{ id, position }, ...] }' },
        { status: 400 }
      )
    }

    // Validar estrutura dos links
    for (let i = 0; i < links.length; i++) {
      const link = links[i]

      if (!link.id) {
        return NextResponse.json(
          { error: `Link no índice ${i} não tem id` },
          { status: 400 }
        )
      }

      if (typeof link.position !== 'number' || link.position < 0) {
        return NextResponse.json(
          { error: `Link com id ${link.id} tem posição inválida` },
          { status: 400 }
        )
      }
    }

    // Verificar se todos os links pertencem ao usuário
    const linkIds = links.map(link => link.id)

    const userLinks = await prisma.link.findMany({
      where: {
        id: { in: linkIds },
        userId: user.id,
      },
      select: {
        id: true,
      },
    })

    if (userLinks.length !== links.length) {
      apiLogger.warn('Reorder attempt with invalid links', {
        userId: user.id,
        requestedLinks: linkIds,
        foundLinks: userLinks.map(l => l.id),
      })

      return NextResponse.json(
        { error: 'Alguns links não pertencem ao usuário' },
        { status: 403 }
      )
    }

    // Atualizar posições em lote
    const updatePromises = links.map(link =>
      prisma.link.update({
        where: { id: link.id },
        data: { position: link.position },
      })
    )

    await Promise.all(updatePromises)

    apiLogger.info('Links reordered', {
      userId: user.id,
      linksCount: links.length,
    })

    return NextResponse.json({
      success: true,
      message: 'Links reordenados com sucesso',
      count: links.length,
    })
  } catch (error) {
    apiLogger.error('Error reordering links', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      { error: 'Erro ao reordenar links' },
      { status: 500 }
    )
  }
}
