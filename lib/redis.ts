/**
 * Cliente Redis e Cache - Arquitetura LinkHub
 *
 * Implementa:
 * - Conexão Redis
 * - Rate limiting
 * - Cache de perfis públicos
 * - Cache de sessões
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

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

// Cliente Redis
let redisInstance: Redis | null = null
let ratelimitInstance: Ratelimit | null = null

/**
 * Inicializa o cliente Redis
 */
export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      token: process.env.REDIS_TOKEN || '',
    })
  }
  return redisInstance
}

/**
 * Inicializa o rate limiter
 */
export function getRatelimit(): Ratelimit {
  if (!ratelimitInstance) {
    const redis = getRedis()
    ratelimitInstance = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requisições por 10 segundos
    })
  }
  return ratelimitInstance
}

/**
 * Verifica rate limiting
 */
export async function checkRateLimit(identifier: string, limit?: number): Promise<{
  allowed: boolean
  remaining: number
  resetAt: string
}> {
  const ratelimit = getRatelimit()
  const { success, remaining, reset } = await ratelimit.limit(identifier)

  return {
    allowed: success,
    remaining,
    resetAt: new Date(reset).toISOString(),
  }
}

/**
 * Obtém dados do cache
 */
export async function getCached<T>(config: CacheConfig): Promise<T | null> {
  const redis = getRedis()
  const cached = await redis.get(config.key)

  if (!cached) return null

  try {
    // Verificar se cached é uma string (pode ser null ou undefined)
    if (typeof cached !== 'string') return null

    const parsed = JSON.parse(cached) as CachedData<T>

    // Verificar se o cache ainda é válido
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
 * Salva dados no cache
 */
export async function setCached<T>(config: CacheConfig, data: T): Promise<void> {
  const redis = getRedis()
  const cached: CachedData<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + config.ttl * 1000,
  }

  await redis.set(config.key, JSON.stringify(cached))
  await redis.expire(config.key, config.ttl)
}

/**
 * Cache de perfil público (5 minutos)
 */
export async function getUserProfile(username: string) {
  const config: CacheConfig = {
    key: `profile:${username}`,
    ttl: 300, // 5 minutos
  }

  let profile = await getCached<any>(config)

  if (!profile) {
    // Buscar do banco se não estiver em cache
    const { prisma } = await import('@/lib/prisma')
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
  await redis.del(`profile:${username}`)
}

/**
 * Cache de sessão (15 minutos)
 */
export async function getSessionData(sessionToken: string) {
  const config: CacheConfig = {
    key: `session:${sessionToken}`,
    ttl: 900, // 15 minutos
  }

  return getCached<any>(config)
}

/**
 * Salva dados de sessão em cache
 */
export async function setSessionData(sessionToken: string, data: any): Promise<void> {
  const config: CacheConfig = {
    key: `session:${sessionToken}`,
    ttl: 900, // 15 minutos
  }

  await setCached(config, data)
}

/**
 * Limpa todo o cache (para debug/admin)
 */
export async function clearCache(pattern: string = '*'): Promise<void> {
  const redis = getRedis()
  const keys = await redis.keys(pattern)

  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStats(): Promise<{
  totalKeys: number
}> {
  const redis = getRedis()
  const keys = await redis.keys('*')

  return {
    totalKeys: keys.length,
  }
}
