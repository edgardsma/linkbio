/**
 * Health Check Simplificado - Arquitetura LinkHub
 *
 * Implementa:
 * - Health check de banco de dados
 * - Health check básico
 */

import { logger } from './logger'

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
 * Verifica conexão com Redis (simplificado)
 */
async function checkRedis(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    // Verificar se Redis está disponível (pela variável de ambiente)
    const redisAvailable = process.env.REDIS_URL || process.env.REDIS_TOKEN

    if (!redisAvailable) {
      throw new Error('Redis não configurado')
    }

    const duration = Date.now() - start

    return {
      status: 'pass',
      duration,
      message: 'Redis configurado (mas não conectado)',
    }
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
 * Health check principal
 */
export async function getHealth(): Promise<HealthResponse> {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ])

  const [database, redis] = checks

  // Determinar status geral
  let status: 'ok' | 'degraded' | 'down' = 'ok'

  if (database.status === 'fail') {
    status = 'down'
  } else if (redis.status === 'fail') {
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
