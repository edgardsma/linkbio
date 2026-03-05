/**
 * Rate Limiting Middleware - LinkBio Brasil
 * Limita o número de requisições por IP e por endpoint
 */

/**
 * Store de rate limiting em memória
 * Em produção, considere usar Redis ou outro store distribuído
 */
const rateLimitStore = new Map()

/**
 * Classe para gerenciar rate limiting
 */
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000 // 15 minutos padrão
    this.maxRequests = options.maxRequests || 100 // 100 requisições padrão
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false
    this.skipFailedRequests = options.skipFailedRequests || false
    this.identifier = options.identifier || 'default'
  }

  /**
   * Limpa registros expirados do store
   */
  cleanup() {
    const now = Date.now()
    const expiredThreshold = now - this.windowMs

    for (const [key, value] of rateLimitStore.entries()) {
      if (value.timestamp < expiredThreshold) {
        rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Verifica se a requisição deve ser limitada
   * @param {string} identifier - Identificador único (IP, userId, etc.)
   * @param {boolean} success - Se a requisição foi bem sucedida
   * @returns {Object} - { limited: boolean, remaining: number, resetAt: number }
   */
  check(identifier, success) {
    // Limpar registros expirados periodicamente
    if (Math.random() < 0.1) { // 10% de chance
      this.cleanup()
    }

    const key = `${this.identifier}:${identifier}`
    const now = Date.now()

    // Pular contagem baseada no resultado, se configurado
    if ((this.skipSuccessfulRequests && success) ||
        (this.skipFailedRequests && !success)) {
      return {
        limited: false,
        remaining: this.maxRequests,
        resetAt: now + this.windowMs,
      }
    }

    const record = rateLimitStore.get(key)

    if (!record) {
      // Primeira requisição
      rateLimitStore.set(key, {
        count: 1,
        timestamp: now,
      })

      return {
        limited: false,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      }
    }

    // Verificar se a janela expirou
    if (now - record.timestamp >= this.windowMs) {
      // Reiniciar contagem
      record.count = 1
      record.timestamp = now

      return {
        limited: false,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      }
    }

    // Incrementar contagem
    record.count++

    if (record.count > this.maxRequests) {
      // Limite excedido
      return {
        limited: true,
        remaining: 0,
        resetAt: record.timestamp + this.windowMs,
      }
    }

    return {
      limited: false,
      remaining: this.maxRequests - record.count,
      resetAt: record.timestamp + this.windowMs,
    }
  }

  /**
   * Retorna os headers HTTP de rate limiting
   * @param {Object} result - Resultado do check()
   * @returns {Object} - Headers HTTP
   */
  getHeaders(result) {
    return {
      'X-RateLimit-Limit': this.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
      'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
    }
  }

  /**
   * Middleware para Next.js API routes
   * @param {Function} handler - Handler da API route
   * @param {Function} getIdentifier - Função para obter identificador
   * @returns {Function} - Middleware function
   */
  middleware(handler, getIdentifier = (req) => this.getIP(req)) {
    return async (request, ...args) => {
      const identifier = await getIdentifier(request)

      try {
        const result = await handler(request, ...args)
        const success = result?.status >= 200 && result?.status < 400

        const checkResult = this.check(identifier, success)

        if (checkResult.limited) {
          return {
            ...result,
            status: 429, // Too Many Requests
            headers: {
              ...result.headers,
              ...this.getHeaders(checkResult),
            },
          }
        }

        return {
          ...result,
          headers: {
            ...result.headers,
            ...this.getHeaders(checkResult),
          },
        }
      } catch (error) {
        const checkResult = this.check(identifier, false)

        if (checkResult.limited) {
          return {
            status: 429,
            json: () => Promise.resolve({
              error: 'Muitas requisições. Tente novamente mais tarde.',
            }),
            headers: this.getHeaders(checkResult),
          }
        }

        throw error
      }
    }
  }

  /**
   * Extrai o IP da requisição
   * @param {Request} request - Request object
   * @returns {string} - IP address
   */
  getIP(request) {
    // Tenta obter IP dos headers (comuns em proxies)
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    // Em desenvolvimento, retorna IP local
    return '127.0.0.1'
  }
}

// ============================================
// Configurações pré-definidas de Rate Limiting
// ============================================

/**
 * Rate limiting para autenticação (mais restrito)
 * 5 requisições por 15 minutos por IP
 */
export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5,
  identifier: 'auth',
})

/**
 * Rate limiting para API geral
 * 100 requisições por 15 minutos por IP
 */
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100,
  identifier: 'api',
})

/**
 * Rate limiting para criação de recursos (links, temas, etc)
 * 20 requisições por hora por IP
 */
export const createRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 20,
  identifier: 'create',
})

/**
 * Rate limiting para QR Code
 * 10 requisições por minuto por IP
 */
export const qrRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10,
  identifier: 'qr',
})

/**
 * Rate limiting para página pública
 * 1000 requisições por minuto por IP
 */
export const publicPageRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 1000,
  identifier: 'public-page',
})

// ============================================
// Helper para usar rate limiting em endpoints
// ============================================

/**
 * Aplica rate limiting em um handler
 * @param {Function} handler - Handler da API route
 * @param {RateLimiter} limiter - RateLimiter instance
 * @param {Function} getIdentifier - Função para obter identificador
 * @returns {Function} - Handler com rate limiting
 */
export function withRateLimit(handler, limiter, getIdentifier) {
  return async (request, ...args) => {
    const identifier = await getIdentifier(limiter.getIP(request))

    // Simular resultado de check (simplificado)
    const result = limiter.check(identifier)

    if (result.limited) {
      return new Response(
        JSON.stringify({
          error: 'Muitas requisições. Tente novamente mais tarde.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...limiter.getHeaders(result),
          },
        }
      )
    }

    // Executar handler original
    const response = await handler(request, ...args)

    // Adicionar headers de rate limiting à resposta
    const headers = new Headers(response.headers)
    Object.entries(limiter.getHeaders(result)).forEach(([key, value]) => {
      headers.set(key, value)
    })

    // Retornar nova resposta com headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}

export { RateLimiter }
