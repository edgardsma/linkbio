/**
 * GET /api/admin/users   - Listar usuários (paginado, com busca)
 * PATCH /api/admin/users - Atualizar role de um usuário
 *
 * Acesso restrito a administradores (protegido pelo root middleware).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { apiLogger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'

const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'userId é obrigatório'),
  role: z.enum(['user', 'admin', 'agency'] as const, {
    message: 'Role deve ser: user, admin ou agency',
  }),
})

async function verifyAdmin(requestId: string) {
  const session = await getServerSession()

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }), user: null }
  }

  const user = session.user as { role?: string; id?: string }
  if (user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 403 }), user: null }
  }

  return { error: null, user }
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)

  try {
    const { error } = await verifyAdmin(requestId)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || undefined

    const skip = (page - 1) * limit

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { username: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(role ? { role } : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          image: true,
          createdAt: true,
          _count: {
            select: { links: true },
          },
          subscription: {
            select: { status: true, plan: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    apiLogger.info('Admin: lista de usuários consultada', {
      requestId,
      total,
      page,
      search: search || undefined,
    })

    return NextResponse.json(
      {
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { headers: { 'x-request-id': requestId } }
    )
  } catch (error) {
    apiLogger.error('Erro ao listar usuários (admin)', error as Error, { requestId })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request)

  try {
    const { error, user: adminUser } = await verifyAdmin(requestId)
    if (error) return error

    const body = await request.json()
    const parsed = updateUserRoleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: { 'x-request-id': requestId } }
      )
    }

    const { userId, role } = parsed.data

    // Não permitir que admin remova a própria role de admin
    if (adminUser?.id === userId && role !== 'admin') {
      return NextResponse.json(
        { error: 'Você não pode remover a sua própria role de administrador' },
        { status: 400, headers: { 'x-request-id': requestId } }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, username: true, role: true },
    })

    apiLogger.info('Admin: role de usuário atualizada', {
      requestId,
      targetUserId: userId,
      newRole: role,
    })

    return NextResponse.json(
      { user: updatedUser, message: 'Role atualizada com sucesso' },
      { headers: { 'x-request-id': requestId } }
    )
  } catch (error) {
    const err = error as { code?: string }
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404, headers: { 'x-request-id': requestId } }
      )
    }
    apiLogger.error('Erro ao atualizar role (admin)', error as Error, { requestId })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    )
  }
}
