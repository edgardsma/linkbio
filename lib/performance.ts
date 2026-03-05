/**
 * Performance Tracking - Arquitetura LinkHub
 *
 * Implementa:
 * - Tracking de tempo de execução de operações
 * - Métricas de performance
 * - Alertas de operações lentas
 */

import { logger } from './logger'

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: string
  metadata?: Record<string, unknown>
  slow?: boolean
}

export interface PerformanceThresholds {
  warning: number  // ms
  critical: number  // ms
}

/**
 * Limites de performance em milissegundos
 */
const THRESHOLDS: Record<string, PerformanceThresholds> = {
  // API Routes
  'POST /api/links': { warning: 500, critical: 2000 },
  'GET /api/links': { warning: 200, critical: 1000 },
  'GET /api/profile': { warning: 200, critical: 1000 },

  // Database operations
  'prisma.user.findUnique': { warning: 100, critical: 500 },
  'prisma.user.create': { warning: 200, critical: 1000 },
  'prisma.link.findMany': { warning: 200, critical: 1000 },

  // Cache operations
  'redis.get': { warning: 50, critical: 200 },
  'redis.set': { warning: 50, critical: 200 },

  // Auth operations
  'next-auth.signIn': { warning: 500, critical: 3000 },
  'next-auth.signOut': { warning: 500, critical: 3000 },
}

/**
 * Armazena métricas recentes (últimas 100 operações)
 */
const metricsHistory: PerformanceMetric[] = []

/**
 * Adiciona métrica ao histórico
 */
function addMetric(metric: PerformanceMetric): void {
  metricsHistory.push(metric)

  // Manter apenas as últimas 100 métricas
  if (metricsHistory.length > 100) {
    metricsHistory.shift()
  }
}

/**
 * Obtém métrica por nome
 */
export function getMetrics(name: string): PerformanceMetric[] {
  return metricsHistory.filter(m => m.name === name)
}

/**
 * Obtém métricas lentas (acima do threshold)
 */
export function getSlowMetrics(threshold = 1000): PerformanceMetric[] {
  return metricsHistory.filter(m => m.duration > threshold)
}

/**
 * Obtém estatísticas gerais
 */
export function getPerformanceStats(): {
  avgDuration: number
  maxDuration: number
  totalOperations: number
  slowOperations: number
} {
  if (metricsHistory.length === 0) {
    return {
      avgDuration: 0,
      maxDuration: 0,
      totalOperations: 0,
      slowOperations: 0,
    }
  }

  const durations = metricsHistory.map(m => m.duration)
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  const maxDuration = Math.max(...durations)
  const slowOperations = metricsHistory.filter(m => m.slow).length

  return {
    avgDuration: Math.round(avgDuration),
    maxDuration,
    totalOperations: metricsHistory.length,
    slowOperations,
  }
}

/**
 * Tracking de performance de uma operação
 */
export async function trackPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
  thresholds?: PerformanceThresholds
): Promise<T> {
  const threshold = thresholds || THRESHOLDS[name]

  const start = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - start

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
      slow: threshold ? duration > threshold.critical : false,
    }

    addMetric(metric)

    // Log se estiver lento
    if (threshold) {
      if (duration > threshold.critical) {
        logger.error(`Performance crítica: ${name}`, {
          duration,
          threshold: threshold.critical,
          ...metadata,
        })
      } else if (duration > threshold.warning) {
        logger.warn(`Performance lenta: ${name}`, {
          duration,
          threshold: threshold.warning,
          ...metadata,
        })
      } else {
        logger.debug(`Performance OK: ${name}`, {
          duration,
          ...metadata,
        })
      }
    }

    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error(`Performance erro: ${name}`, error as Error, {
      duration,
      ...metadata,
    })

    throw error
  }
}

/**
 * Wrapper para API Routes com tracking automático
 */
export function withPerformanceTracking<T>(
  name: string,
  handler: (request: Request) => Promise<T>,
  thresholds?: PerformanceThresholds
) {
  return async (request: Request): Promise<T> => {
    return trackPerformance(name, () => handler(request), {
      method: request.method,
      url: request.url,
    }, thresholds)
  }
}

/**
 * Wrapper para operações do Prisma
 */
export async function trackPrismaOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return trackPerformance(`prisma.${operation}`, fn, {
    operation,
  })
}

/**
 * Wrapper para operações do Redis
 */
export async function trackRedisOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return trackPerformance(`redis.${operation}`, fn, {
    operation,
  })
}

/**
 * Health check de performance
 */
export async function getPerformanceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  stats: ReturnType<typeof getPerformanceStats>
  slowOperations: PerformanceMetric[]
}> {
  const stats = getPerformanceStats()
  const slowOperations = getSlowMetrics()
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  if (stats.slowOperations > 10) {
    status = 'unhealthy'
  } else if (stats.slowOperations > 5) {
    status = 'degraded'
  }

  return {
    status,
    stats,
    slowOperations,
  }
}

/**
 * Limpa histórico de métricas
 */
export function clearMetrics(): void {
  metricsHistory.length = 0
  logger.info('Métricas de performance limpas')
}
