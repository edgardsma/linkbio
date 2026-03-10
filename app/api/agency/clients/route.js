import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { requireAuth, UserRole, isAgencyOrAdmin } from '@/lib/auth'
import { logger, apiLogger } from '@/lib/logger.js'
import { getRequestId, withRequestId } from '@/lib/middleware'
import { trackPerformance, trackPrismaOperation } from '@/lib/performance'

/**
 * GET /api/agency/clients - Listar todos os clientes da agência
 */
export async function GET(request) {
  return trackPerformance('GET /api/agency/clients', async () => {
    const requestId = getRequestId()

    try {
      apiLogger.info('Agência listar clientes solicitado', { requestId })

      const user = await requireAuth(request)

      // Verificar se é agência ou admin
      if (!(await isAgencyOrAdmin(request))) {
        apiLogger.warn('Acesso negado - não é agência', { requestId, userId: user.id })
        return NextResponse.json(
          { error: 'Acesso negado. Plano PRO ou ADMIN necessário.' },
          { status: 403 }
        )
      }

      // Buscar todos os clientes da agência
      const clientes = await trackPrismaOperation('agency.clients.findMany', async () => {
        return prisma.user.findMany({
          where: {
            agencyId: user.id,
            role: 'USER', // Apenas usuários regulares
          },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            image: true,
            bio: true,
            createdAt: true,
            _count: {
              links: true,
              clicks: true,
              subscription: true,
            },
            subscription: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      })

      apiLogger.info('Clientes listados com sucesso', {
        requestId,
        agencyId: user.id,
        totalClientes: clientes.length,
      })

      const response = NextResponse.json({ clientes })
      return withRequestId(response)
    } catch (error) {
      logger.error('Erro ao listar clientes da agência', error, { requestId })
      return NextResponse.json(
        { error: 'Erro ao buscar clientes' },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/agency/clients - Criar novo cliente para a agência
 */
export async function POST(request) {
  return trackPerformance('POST /api/agency/clients', async () => {
    const requestId = getRequestId()

    try {
      apiLogger.info('Agência criar cliente solicitado', { requestId })

      const user = await requireAuth(request)

      // Verificar se é agência ou admin
      if (!(await isAgencyOrAdmin(request))) {
        apiLogger.warn('Acesso negado - não é agência', { requestId, userId: user.id })
        return NextResponse.json(
          { error: 'Acesso negado. Plano PRO ou ADMIN necessário.' },
          { status: 403 }
        )
      }

      // Verificar limites de agência
      const [agencyUser] = await trackPrismaOperation('agency.user.findMany', async () => {
        return prisma.user.findMany({
          where: {
            agencyId: user.id,
            role: 'USER', // Apenas usuários regulares
          },
          select: { id: true },
        })
      })

      if (agencyUser.length >= 100) {
        apiLogger.warn('Limite de clientes atingido', { requestId, agencyId: user.id })
        return NextResponse.json(
          { error: 'Limite de 100 clientes atingido' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const { email, password, name, bio } = body

      // Validações
      const erros = {}

      if (!email) {
        erros.email = 'Email é obrigatório'
      } else if (!/^[^\s@]+@[^\s@.]+$/.test(email)) {
        erros.email = 'Email inválido'
      }

      if (!password) {
        erros.password = 'Senha é obrigatória'
      } else if (password.length < 8) {
        erros.password = 'Senha deve ter no mínimo 8 caracteres'
      }

      if (!name) {
        erros.name = 'Nome é obrigatório'
      } else if (name.length > 100) {
        erros.name = 'Nome deve ter no máximo 100 caracteres'
      }

      if (Object.keys(erros).length > 0) {
        apiLogger.warn('Dados inválidos ao criar cliente', { requestId, erros })
        return NextResponse.json(
          { error: 'Dados inválidos', detalhes: erros },
          { status: 400 }
        )
      }

      // Verificar se email já está em uso
      const existingUser = await trackPrismaOperation('user.findByEmail', async () => {
        return prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true },
        })
      })

      if (existingUser) {
        apiLogger.warn('Email já em uso', { requestId, email })
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        )
      }

      // Criar novo cliente
      const bcrypt = require('bcryptjs')
      const senhaHash = await bcrypt.hash(password, 12)

      const novoCliente = await trackPrismaOperation('user.create', async () => {
        return prisma.user.create({
          data: {
            email,
            password: senhaHash,
            name,
            bio: bio || null,
            username: await gerarUsernameUnico(email),
            role: 'USER',
            agencyId: user.id, // Associar à agência
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            backgroundColor: '#f9fafb',
            textColor: '#111827',
          },
        })
      })

      apiLogger.info('Cliente criado com sucesso', {
        requestId,
        agencyId: user.id,
        clientId: novoCliente.id,
        clientEmail: novoCliente.email,
        clientName: novoCliente.name,
      })

      const response = NextResponse.json({
        cliente: {
          id: novoCliente.id,
          email: novoCliente.email,
          name: novoCliente.name,
          username: novoCliente.username,
          createdAt: novoCliente.createdAt,
        },
        mensagem: 'Cliente criado com sucesso. Credenciais de acesso foram enviadas para o cliente.'
      })

      return withRequestId(response)
    } catch (error) {
      logger.error('Erro ao criar cliente', error, { requestId })
      return NextResponse.json(
        { error: 'Erro ao criar cliente' },
        { status: 500 }
      )
    }
  })
}

/**
 * Helper para gerar username único a partir do email
 */
async function gerarUsernameUnico(email) {
  // Remover caracteres especiais do email
  const emailBase = email.split('@')[0]
  const emailLimpo = emailBase.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Criar username baseado no email
  const username = `${emailLimpo}-${Date.now().toString(36)}`

  // Verificar se já existe
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })

  if (existing) {
    // Adicionar timestamp para garantir unicidade
    return `${username}-${Date.now().toString(36)}`
  }

  return username
}
