/**
 * Health Check e Monitoramento - Arquitetura LinkHub
 *
 * Implementa:
 * - Health check de banco de dados
 * - Health check de Redis
 * - Estatísticas de performance
 * - Uptime do servidor
 */

import { getRedis } from './redis'
import { logger } from './logger'
import { getPerformanceHealth } from './performance'

export interface HealthCheckResult {
  status: 'pass' | 'fail'
  duration: number
  message?: string
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded'
  duration: number
  message?: string
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: ServiceHealth
    redis: ServiceHealth
    performance: ServiceHealth
  }
}

/**
 * Verifica conexão com PostgreSQL
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    const { prisma } = await import('./prisma')

    // Query simples para testar conexão
    await prisma.$queryRaw`SELECT 1`

    const duration = Date.now() - start

    return {
      status: 'pass',
      duration,
      message: 'Conexão com PostgreSQL está ok',
    }
  } catch (error) {
    const duration = Date.now() - start
    logger.error('Health check falhou: Banco de dados', error as Error)

    return {
      status: 'fail',
      duration,
      message: 'Erro ao conectar com PostgreSQL',
    }
  }
}

/**
 * Verifica conexão com Redis
 */
async function checkRedis(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    const redis = getRedis()

    if (!redis) {
      return { status: 'pass', duration: 0, message: 'Redis não configurado (opcional)' }
    }

    // Comando PING do Redis
    const result = await redis.ping()

    if (result === 'PONG') {
      const duration = Date.now() - start

      return {
        status: 'pass',
        duration,
        message: 'Conexão com Redis está ok',
      }
    }

    throw new Error('Redis não respondeu com PONG')
  } catch (error) {
    const duration = Date.now() - start
    logger.error('Health check falhou: Redis', error as Error)

    return {
      status: 'fail',
      duration,
      message: 'Erro ao conectar com Redis',
    }
  }
}

/**
 * Verifica performance do sistema
 */
async function checkPerformance(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    const health = await getPerformanceHealth()

    const duration = Date.now() - start

    return {
      status: health.status === 'healthy' ? 'pass' : 'fail',
      duration,
      message: `Status: ${health.status}, Operações lentas: ${health.slowOperations.length}`,
    }
  } catch (error) {
    const duration = Date.now() - start
    logger.error('Health check falhou: Performance', error as Error)

    return {
      status: 'fail',
      duration,
      message: 'Erro ao verificar performance',
    }
  }
}

/**
 * Health check principal
 */
export async function getHealth(): Promise<HealthResponse> {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkPerformance(),
  ])

  const [database, redis, performance] = checks

  // Determinar status geral
  let status: 'ok' | 'degraded' | 'down' = 'ok'

  if (database.status === 'fail' || redis.status === 'fail') {
    status = 'down'
  } else if (performance.status === 'fail') {
    status = 'degraded'
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: {
        status: database.status === 'pass' ? 'up' : 'down',
        duration: database.duration,
        message: database.message,
      },
      redis: {
        status: redis.status === 'pass' ? 'up' : 'down',
        duration: redis.duration,
        message: redis.message,
      },
      performance: {
        status: performance.status === 'pass' ? 'up' : 'down',
        duration: performance.duration,
        message: performance.message,
      },
    },
  }
}

/**
 * Health check simplificado (apenas status)
 */
export async function getHealthSimple(): Promise<{
  status: string
  database: string
  redis: string
}> {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ])

  const [database, redis] = checks

  return {
    status: database.status === 'pass' ? 'ok' : 'error',
    database: database.status === 'pass' ? 'up' : 'down',
    redis: redis.status === 'pass' ? 'up' : 'down',
  }
}

/**
 * Endpoint handler para health check
 */
export async function GET() {
  try {
    const health = await getHealth()
    logger.info('Health check executado', {
      status: health.status,
      uptime: health.uptime,
    })

    return Response.json(health)
  } catch (error) {
    logger.error('Health check falhou', error as Error)

    return Response.json(
      {
        status: 'error',
        message: 'Erro ao executar health check',
      },
      { status: 500 }
    )
  }
}

/**
 * Endpoint handler para health check simples
 */
export async function GETSimple() {
  try {
    const health = await getHealthSimple()
    return Response.json(health)
  } catch (error) {
    logger.error('Health check simples falhou', error as Error)
    return Response.json(
      {
        status: 'error',
        message: 'Erro ao executar health check',
      },
      { status: 500 }
    )
  }
}
