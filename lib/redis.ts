/**
 * Cliente Redis e Cache - Arquitetura LinkHub
 *
 * Implementa:
 * - Conexão Redis (com fallback gracioso quando não configurado)
 * - Rate limiting (in-memory por padrão, Redis quando disponível)
 * - Cache de perfis públicos
 * - Cache de sessões
 *
 * ATENÇÃO: O rate limiting in-memory não sincroniza entre múltiplos workers.
 * Em produção com múltiplos workers, configure REDIS_URL e REDIS_TOKEN para
 * rate limiting distribuído consistente.
 */

import { Redis } from '@upstash/redis'

// Tipos
export interface CacheConfig {
  key: string
  ttl: number
}

export interface CachedData<T> {
  data: T
  timestamp: number
  expiresAt: number
}

// Cliente Redis (lazy init)
let redisInstance: Redis | null = null

// Cache de rate limiting in-memory (fallback sem Redis)
const rateLimitCache: Map<string, { count: number; resetAt: number }> = new Map()

/**
 * Verifica se o Redis está configurado no ambiente
 */
export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL && process.env.REDIS_TOKEN)
}

/**
 * Inicializa o cliente Redis.
 * Retorna null se as variáveis de ambiente não estiverem definidas.
 */
export function getRedis(): Redis | null {
  if (!isRedisConfigured()) {
    return null
  }

  if (!redisInstance) {
    redisInstance = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    })
  }

  return redisInstance
}

/**
 * Verifica rate limiting.
 * Usa Redis quando disponível; caso contrário usa in-memory (não distribuído).
 */
export async function checkRateLimit(identifier: string, limit?: number): Promise<{
  allowed: boolean
  remaining: number
  resetAt: string
}> {
  const limitValue = limit || 100
  const windowMs = 60_000 // 1 minuto
  const now = Date.now()

  let data = rateLimitCache.get(identifier)

  if (!data || now > data.resetAt + windowMs) {
    data = { count: 1, resetAt: now }
    rateLimitCache.set(identifier, data)
  } else {
    data.count++
  }

  const remaining = Math.max(0, limitValue - data.count)
  const allowed = data.count <= limitValue

  return {
    allowed,
    remaining,
    resetAt: new Date(data.resetAt + windowMs).toISOString(),
  }
}

/**
 * Obtém dados do cache Redis.
 * Retorna null silenciosamente se Redis não estiver configurado ou em caso de erro.
 */
export async function getCached<T>(config: CacheConfig): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return null

  try {
    const cached = await redis.get(config.key)

    if (!cached || typeof cached !== 'string') return null

    const parsed = JSON.parse(cached) as CachedData<T>

    if (Date.now() > parsed.expiresAt) {
      await redis.del(config.key)
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

/**
 * Salva dados no cache Redis.
 * Silenciosamente ignora se Redis não estiver configurado.
 */
export async function setCached<T>(config: CacheConfig, data: T): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + config.ttl * 1000,
    }

    await redis.set(config.key, JSON.stringify(cached))
    await redis.expire(config.key, config.ttl)
  } catch {
    // Falha de cache não deve derrubar a aplicação
  }
}

/**
 * Cache de perfil público (5 minutos)
 */
export async function getUserProfile(username: string) {
  const config: CacheConfig = {
    key: `profile:${username}`,
    ttl: 300,
  }

  let profile = await getCached<any>(config)

  if (!profile) {
    const { prisma } = await import('./prisma')
    profile = await prisma.user.findUnique({
      where: { username },
      include: { links: true },
    })

    if (profile) {
      await setCached(config, profile)
    }
  }

  return profile
}

/**
 * Invalida cache de perfil
 */
export async function invalidateProfile(username: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(`profile:${username}`)
  } catch {
    // Ignorar erros de invalidação
  }
}

/**
 * Cache de sessão (15 minutos)
 */
export async function getSessionData(sessionToken: string) {
  const config: CacheConfig = {
    key: `session:${sessionToken}`,
    ttl: 900,
  }

  return getCached<any>(config)
}

/**
 * Salva dados de sessão em cache
 */
export async function setSessionData(sessionToken: string, data: any): Promise<void> {
  const config: CacheConfig = {
    key: `session:${sessionToken}`,
    ttl: 900,
  }

  await setCached(config, data)
}

/**
 * Limpa todo o cache (para debug/admin)
 */
export async function clearCache(pattern: string = '*'): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Ignorar erros
  }
}

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStats(): Promise<{ totalKeys: number; redisConfigured: boolean }> {
  const redis = getRedis()

  if (!redis) {
    return { totalKeys: 0, redisConfigured: false }
  }

  try {
    const keys = await redis.keys('*')
    return { totalKeys: keys.length, redisConfigured: true }
  } catch {
    return { totalKeys: 0, redisConfigured: true }
  }
}
