import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'

// API de teste simples para verificar Prisma
export async function GET() {
  try {
    // Teste 1: Contar usuários
    const userCount = await prisma.user.count()

    // Teste 2: Buscar primeiro usuário
    const firstUser = await prisma.user.findFirst()

    // Teste 3: Verificar se há tabelas
    const tableCount = await prisma.$queryRaw`SELECT COUNT(*) FROM "User"`

    return NextResponse.json({
      status: 'ok',
      prisma: 'funcionando',
      tests: {
        userCount: userCount,
        firstUser: firstUser ? {
          id: firstUser.id,
          email: firstUser.email,
          username: firstUser.username
        } : null,
        tableCount: Number(tableCount[0].count),
      },
      database: 'postgresql',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao testar Prisma:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
  }
}
