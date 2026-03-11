import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { withRateLimit, authRateLimit } from '@/lib/rate-limit.js'
import { authLogger } from '@/lib/logger'

/**
 * Endpoint para obter token JWT via API
 * Autentica diretamente com email/senha e retorna o token JWT
 */
export async function POST(request) {
  // Aplicar rate limiting
  const identifier = authRateLimit.getIP(request)
  const rateLimitResult = authRateLimit.check(identifier)

  if (rateLimitResult.limited) {
    authLogger.warn('Rate limit exceeded', {
      endpoint: '/api/auth/token',
      ip: identifier,
    })

    return NextResponse.json(
      { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
      {
        status: 429,
        headers: authRateLimit.getHeaders(rateLimitResult),
      }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = body

    // Validações
    const errors = {}

    if (!email) {
      errors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido'
    }

    if (!password) {
      errors.password = 'Senha é obrigatória'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: errors },
        { status: 400 }
      )
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (!user || !user.password) {
      authLogger.warn('Login attempt failed - user not found', {
        email,
        ip: identifier,
      })

      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(body.password, user.password)

    if (!passwordMatch) {
      authLogger.warn('Login attempt failed - invalid password', {
        email,
        ip: identifier,
      })

      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Gerar token JWT
    const token = sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    authLogger.info('Login successful', {
      userId: user.id,
      email,
      ip: identifier,
    })

    // Retornar token e dados do usuário
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    }, {
      headers: authRateLimit.getHeaders(rateLimitResult),
    })
  } catch (error) {
    authLogger.error('Error in /api/auth/token', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
