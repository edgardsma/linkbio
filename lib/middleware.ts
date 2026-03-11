/**
 * Middleware de Request ID - Arquitetura LinkHub
 *
 * Adiciona um ID único a cada requisição para tracking e debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Gera ou recupera o request ID dos headers da requisição.
 * Passe o objeto request para reutilizar o ID gerado pelo middleware.
 * Sem request, gera um novo UUID.
 */
export function getRequestId(request?: Request | NextRequest): string {
  if (request) {
    return request.headers.get(REQUEST_ID_HEADER) || uuidv4()
  }
  return uuidv4()
}

/**
 * Adiciona request ID à resposta
 */
export function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId)
  return response
}

/**
 * Middleware para Next.js — injeta x-request-id em todas as requisições
 */
export async function middleware(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) || uuidv4()

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
