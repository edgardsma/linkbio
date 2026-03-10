import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { logger } from '@/lib/logger'
import bcrypt from 'bcrypt'

// POST /api/auth/reset-password - Resetar senha com token
export async function POST(request) {
  try {
    const { token, password, confirmPassword } = await request.json()

    // Validações
    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Nova senha é obrigatória' },
        { status: 400 }
      )
    }

    if (!confirmPassword) {
      return NextResponse.json(
        { error: 'Confirmação de senha é obrigatória' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Senhas não conferem' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    // Buscar token de reset
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      logger.warn('Token de reset não encontrado', { token })
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Verificar se o token expirou
    if (new Date() > resetToken.expires) {
      logger.warn('Token de reset expirado', {
        token,
        expires: resetToken.expires,
      })
      return NextResponse.json(
        { error: 'Token expirado. Por favor, solicite um novo reset' },
        { status: 400 }
      )
    }

    // Verificar se o token já foi usado
    if (resetToken.used) {
      logger.warn('Token de reset já usado', { token })
      return NextResponse.json(
        { error: 'Token já foi utilizado. Por favor, solicite um novo reset' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Atualizar senha do usuário
    await prisma.user.update({
      where: { id: resetToken.user.id },
      data: { password: hashedPassword },
    })

    // Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    })

    logger.info('Senha resetada com sucesso', {
      userId: resetToken.user.id,
      email: resetToken.user.email,
    })

    return NextResponse.json({
      message: 'Senha resetada com sucesso!',
    })
  } catch (error) {
    logger.error('Erro ao resetar senha', error)
    return NextResponse.json(
      { error: 'Erro ao resetar senha' },
      { status: 500 }
    )
  }
}

// GET /api/auth/reset-password - Verificar se token é válido
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar token de reset
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      )
    }

    // Verificar se o token expirou
    if (new Date() > resetToken.expires) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 400 }
      )
    }

    // Verificar se o token já foi usado
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Token já utilizado' },
        { status: 400 }
      )
    }

    // Token válido - retornar email (para mostrar na página de reset)
    return NextResponse.json({
      valid: true,
      email: resetToken.user.email,
    })
  } catch (error) {
    logger.error('Erro ao verificar token', error)
    return NextResponse.json(
      { error: 'Erro ao verificar token' },
      { status: 500 }
    )
  }
}
