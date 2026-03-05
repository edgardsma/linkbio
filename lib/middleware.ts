/**
 * Middleware de Request ID - Arquitetura LinkHub
 *
 * Adiciona um ID único a cada requisição para tracking e debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Gera ou recupera o request ID dos headers
 */
export function getRequestId(): string {
  try {
    const headers = new Headers()
    const requestId = headers.get(REQUEST_ID_HEADER)
    return requestId || uuidv4()
  } catch {
    return uuidv4()
  }
}

/**
 * Adiciona request ID à resposta
 */
export function withRequestId(response: NextResponse): NextResponse {
  const requestId = getRequestId()
  response.headers.set(REQUEST_ID_HEADER, requestId)
  return response
}

/**
 * Middleware para Next.js
 */
export async function middleware(request: NextRequest) {
  const requestId = uuidv4()

  const response = NextResponse.next()
  response.headers.set(REQUEST_ID_HEADER, requestId)

  return response
}

// Configurar quais rotas devem ser afetadas
export const config = {
  matcher: [
    /*
     * Match todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (imagens otimizadas)
     * - favicon.ico
     * - arquivos públicos
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
