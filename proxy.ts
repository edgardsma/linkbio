/**
 * Root Middleware - LinkBio Brasil
 *
 * Responsabilidades:
 * 1. Adicionar request ID (x-request-id) em todas as requisições
 * 2. Proteger rotas /dashboard/admin e /api/admin/* (apenas ADMIN)
 * 3. Redirecionar para login se não autenticado
 */

import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PAGE_ROUTES = ['/dashboard/admin', '/admin']
const ADMIN_API_ROUTES = ['/api/admin']

function isAdminPageRoute(pathname: string): boolean {
  return ADMIN_PAGE_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

function isAdminApiRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Adicionar ou reutilizar request ID
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()

  // Proteger rotas de admin
  if (isAdminPageRoute(pathname) || isAdminApiRoute(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    // Não autenticado
    if (!token) {
      if (isAdminApiRoute(pathname)) {
        return NextResponse.json(
          { error: 'Não autenticado' },
          { status: 401, headers: { 'x-request-id': requestId } }
        )
      }
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Autenticado mas sem role admin
    if (token.role !== 'admin') {
      if (isAdminApiRoute(pathname)) {
        return NextResponse.json(
          { error: 'Não autorizado: acesso restrito ao administrador' },
          { status: 403, headers: { 'x-request-id': requestId } }
        )
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  return response
}

export const config = {
  matcher: [
    /*
     * Executar em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (imagens otimizadas)
     * - favicon.ico
     * - arquivos de imagem públicos
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
