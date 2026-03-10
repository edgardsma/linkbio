import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import bcrypt from 'bcryptjs'
import { validateData, ValidationError } from '@/lib/validation.js'
import { authRateLimit } from '@/lib/rate-limit.js'

export async function POST(request) {
  // Aplicar rate limiting
  const identifier = authRateLimit.getIP(request)
  const rateLimitResult = authRateLimit.check(identifier)

  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: 'Muitas tentativas de registro. Tente novamente em 15 minutos.' },
      {
        status: 429,
        headers: authRateLimit.getHeaders(rateLimitResult),
      }
    )
  }
  try {
    const body = await request.json()
    const { name, email, username, password } = body

    // Validação usando Zod
    const schema = {
      email: (value) => {
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Email inválido')
        }
      },
      password: (value) => {
        if (!value || value.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres')
        }
      },
      name: (value) => {
        if (!value || value.length < 2) {
          throw new Error('Nome deve ter no mínimo 2 caracteres')
        }
      },
      username: (value) => {
        if (!value || value.length < 3) {
          throw new Error('Username deve ter no mínimo 3 caracteres')
        }
        if (value.length > 30) {
          throw new Error('Username deve ter no máximo 30 caracteres')
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          throw new Error('Username só pode conter letras, números e underscore')
        }
      },
    }

    // Executar validações
    const errors = {}
    if (email) {
      try {
        schema.email(email)
      } catch (e) {
        errors.email = e.message
      }
    } else {
      errors.email = 'Email é obrigatório'
    }

    if (password) {
      try {
        schema.password(password)
      } catch (e) {
        errors.password = e.message
      }
    } else {
      errors.password = 'Senha é obrigatória'
    }

    if (name) {
      try {
        schema.name(name)
      } catch (e) {
        errors.name = e.message
      }
    } else {
      errors.name = 'Nome é obrigatório'
    }

    if (username) {
      try {
        schema.username(username)
      } catch (e) {
        errors.username = e.message
      }
    } else {
      errors.username = 'Username é obrigatório'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: errors },
        { status: 400 }
      )
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado' },
          { status: 400 }
        )
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Este nome de usuário já está em uso' },
          { status: 400 }
        )
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword,
      },
    })

    // Criar assinatura gratuita
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: 'active',
        plan: 'free',
      },
    })

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        },
      },
      {
        status: 201,
        headers: authRateLimit.getHeaders(rateLimitResult),
      }
    )
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    )
  }
}
