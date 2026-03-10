import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// POST /api/auth/forgot-password - Solicitar reset de senha
export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Não revelamos se o usuário existe por segurança
      logger.info('Solicitação de reset para email não encontrado', { email })
      return NextResponse.json(
        { message: 'Se o email existir, você receberá um link de reset' },
        { status: 200 }
      )
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Deletar tokens antigos do usuário
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, used: false },
    })

    // Criar novo token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expires,
      },
    })

    logger.info('Token de reset criado', {
      userId: user.id,
      email,
      resetToken,
      expires,
    })

    // Em produção, enviar email aqui
    // Por enquanto, retornar o token para desenvolvimento
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    logger.info('URL de reset gerada', { resetUrl })

    return NextResponse.json({
      message: 'Se o email existir, você receberá um link de reset',
      // Em produção, não retornar o token
      // resetUrl,
      // Para desenvolvimento, retornar o token
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    })
  } catch (error) {
    logger.error('Erro ao processar solicitação de reset', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
