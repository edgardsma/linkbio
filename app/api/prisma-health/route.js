import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-simple'

// Health Check simples para Prisma
export async function GET() {
  try {
    // Teste 1: Conexão com banco
    await prisma.$connect()

    // Teste 2: Query simples
    const userCount = await prisma.user.count()

    // Teste 3: Query com raw SQL
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`

    return NextResponse.json({
      status: 'ok',
      prisma: 'funcionando',
      tests: {
        connection: 'conectado',
        userCount: userCount,
        rawQuery: Number(result[0].count),
      },
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
