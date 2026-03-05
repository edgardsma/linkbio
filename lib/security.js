/**
 * Middleware de Segurança - LinkBio Brasil
 * Adiciona headers HTTP de segurança e gerencia CORS
 */

/**
 * Headers de segurança padrão
 */
export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
}

/**
 * Headers de CORS
 * @param {Object} options - Opções de CORS
 * @returns {Object} - Headers de CORS
 */
export function getCorsHeaders(options = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false,
    maxAge = 86400, // 24 horas
  } = options

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
    'Access-Control-Allow-Credentials': credentials.toString(),
    'Access-Control-Max-Age': maxAge.toString(),
    'Vary': 'Origin',
  }
}

/**
 * Adiciona headers de segurança a uma Response
 * @param {Response} response - Response object
 * @returns {Response} - Response com headers de segurança
 */
export function addSecurityHeaders(response) {
  const headers = new Headers(response.headers)

  // Adicionar headers de segurança
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value)
    }
  })

  // Retornar nova Response com headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Adiciona headers de CORS a uma Response
 * @param {Response} response - Response object
 * @param {Object} corsOptions - Opções de CORS
 * @returns {Response} - Response com headers de CORS
 */
export function addCorsHeaders(response, corsOptions = {}) {
  const headers = new Headers(response.headers)
  const corsHeaders = getCorsHeaders(corsOptions)

  // Adicionar headers de CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })

  // Retornar nova Response com headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Adiciona headers de segurança e CORS a uma Response
 * @param {Response} response - Response object
 * @param {Object} corsOptions - Opções de CORS
 * @returns {Response} - Response com headers de segurança e CORS
 */
export function addSecurityAndCorsHeaders(response, corsOptions = {}) {
  const headers = new Headers(response.headers)

  // Adicionar headers de segurança
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value)
    }
  })

  // Adicionar headers de CORS
  const corsHeaders = getCorsHeaders(corsOptions)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })

  // Retornar nova Response com headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Middleware para OPTIONS (preflight)
 * @param {Object} corsOptions - Opções de CORS
 * @returns {Response} - Response para OPTIONS
 */
export function handleOptions(corsOptions = {}) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(corsOptions),
  })
}

/**
 * Valida origem para CORS
 * @param {string} origin - Origin header
 * @param {Array<string>} allowedOrigins - Origens permitidas
 * @returns {boolean} - Se origin é permitida
 */
export function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) {
    return true
  }

  // Se for asterisco, permite qualquer origem
  if (allowedOrigins.includes('*')) {
    return true
  }

  // Verifica se origin está na lista
  return allowedOrigins.includes(origin)
}

/**
 * Opções de CORS para diferentes ambientes
 */
export const corsOptions = {
  development: {
    origin: '*',
    credentials: false,
  },
  production: {
    origin: [
      'https://linkbio-brasil.com',
      'https://www.linkbio-brasil.com',
    ],
    credentials: true,
  },
}

/**
 * Headers de segurança específicos para API
 */
export const apiSecurityHeaders = {
  ...securityHeaders,
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

/**
 * Headers de segurança para páginas públicas
 */
export const publicPageSecurityHeaders = {
  ...securityHeaders,
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
}

/**
 * Sanitiza input HTML para prevenir XSS
 * @param {string} input - Input HTML
 * @returns {string} - Input sanitizado
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove tags HTML perigosas
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Valida URL para prevenir ataques
 * @param {string} url - URL a ser validada
 * @returns {boolean} - Se URL é válida
 */
export function isValidURL(url) {
  try {
    const parsed = new URL(url)

    // Apenas http e https são permitidos
    if (
!['http:', 'https:'].includes(parsed.protocol)
) {
      return false
    }

    // Bloqueia localhost e IPs privados em produção
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Rate limiting para prevenir brute force
 * (já implementado em lib/rate-limit.js)
 */
export { withRateLimit } from './rate-limit.js'

/**
 * Valida email para prevenir ataques
 * @param {string} email - Email a ser validado
 * @returns {boolean} - Se email é válido
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Valida username para prevenir ataques
 * @param {string} username - Username a ser validado
 * @returns {boolean} - Se username é válido
 */
export function isValidUsername(username) {
  // Apenas letras, números e underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
}

/**
 * Remove caracteres perigosos de strings
 * @param {string} input - Input a ser sanitizado
 * @returns {string} - Input sanitizado
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return ''
  }

  return input.replace(/[<>\"'\/\\]/g, '')
}
