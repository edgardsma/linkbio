/**
 * Cliente Redis e Cache - Arquitetura LinkHub
 *
 * Implementa:
 * - Conexão Redis
 * - Rate limiting simplificado
 * - Cache de perfis públicos
 * - Cache de sessões
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

// Cliente Redis
let redisInstance: Redis | null = null

// Cache de rate limiting em memória para desenvolvimento
const rateLimitCache: Map<string, { count: number; resetAt: number }> = new Map()

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
 * Verifica rate limiting (simplificado)
 */
export async function checkRateLimit(identifier: string, limit?: number): Promise<{
  allowed: boolean
  remaining: number
  resetAt: string
}> {
  const limitValue = limit || 100 // padrão: 100 requisições

  const now = Date.now()
  const windowMs = 60000 // 1 minuto em milissegundos

  let data = rateLimitCache.get(identifier)

  if (!data || now > data.resetAt + windowMs) {
    // Criar nova janela
    data = { count: 1, resetAt: now }
    rateLimitCache.set(identifier, data)
  } else {
    // Incrementar contador
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
 * Obtém dados do cache
 */
export async function getCached<T>(config: CacheConfig): Promise<T | null> {
  try {
    const redis = getRedis()
    const cached = await redis.get(config.key)

    if (!cached) return null

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
