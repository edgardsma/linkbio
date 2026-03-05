import { NextResponse } from 'next/server'
import { GET as getHealth } from '@/lib/health'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'

/**
 * API Route: Health Check
 *
 * Endpoint para monitoramento de saúde do sistema
 * Verifica: banco de dados, Redis, performance
 */
export async function GET(request) {
  const requestId = getRequestId()

  try {
    logger.info('Health check solicitado', {
      requestId,
      url: request.url,
    })

    const health = await getHealth()

    logger.info('Health check concluído', {
      requestId,
      status: health.status,
      uptime: health.uptime,
    })

    return NextResponse.json(health)
  } catch (error) {
    logger.error('Health check falhou', error, {
      requestId,
      url: request.url,
    })

    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro ao executar health check',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
