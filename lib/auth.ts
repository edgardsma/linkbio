/**
 * Sistema de Autenticação e RBAC - Arquitetura LinkHub
 *
 * Implementa:
 * - Enum de roles (USER, ADMIN, AGENCY)
 * - Verificação de permissões
 * - Middleware de autorização
 * - Helpers de autenticação
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Tipos
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  AGENCY = 'agency',
}

export interface UserWithRole {
  id: string
  email: string
  name?: string
  username: string
  role: UserRole
  image?: string
}

export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'admin'
}

/**
 * Mapa de recursos para roles
 */
const PERMISSIONS: Record<string, UserRole[]> = {
  // Rotas de admin - apenas ADMIN
  '/api/admin/*': [UserRole.ADMIN],

  // Rotas de usuários - AGENCY e ADMIN
  '/api/users': [UserRole.AGENCY, UserRole.ADMIN],
  '/api/analytics': [UserRole.AGENCY, UserRole.ADMIN],

  // Rotas de perfil - USER, AGENCY, ADMIN
  '/api/profile': [UserRole.USER, UserRole.AGENCY, UserRole.ADMIN],
  '/api/links': [UserRole.USER, UserRole.AGENCY, UserRole.ADMIN],
}

/**
 * Verifica se usuário tem role específico
 */
export function hasRole(user: UserWithRole, role: UserRole): boolean {
  if (user.role === UserRole.ADMIN) return true
  return user.role === role
}

/**
 * Verifica se usuário tem qualquer um dos roles
 */
export function hasAnyRole(user: UserWithRole, roles: UserRole[]): boolean {
  if (user.role === UserRole.ADMIN) return true
  return roles.includes(user.role)
}

/**
 * Verifica se usuário tem acesso a um recurso
 */
export function canAccess(user: UserWithRole, resource: string): boolean {
  // Admin tem acesso a tudo
  if (user.role === UserRole.ADMIN) return true

  // Buscar permissões necessárias para o recurso
  const requiredRoles = Object.entries(PERMISSIONS)
    .find(([pattern]) => {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
      return regex.test(resource)
    })
    ?.[1]

  // Se não há restrições específicas, permitir acesso
  if (!requiredRoles) return true

  // Verificar se usuário tem algum dos roles necessários
  return requiredRoles.includes(user.role)
}

/**
 * Verifica se usuário pode realizar ação específica em recurso
 */
export function canPerformAction(
  user: UserWithRole,
  resource: string,
  action: Permission['action']
): boolean {
  // Admin pode tudo
  if (user.role === UserRole.ADMIN) return true

  // Apenas admin pode fazer ações admin
  if (action === 'admin') return false

  // Verificar acesso ao recurso
  return canAccess(user, resource)
}

/**
 * Cria middleware de autorização
 */
export function authorize(requiredRoles?: UserRole[]) {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const user = session.user as UserWithRole

    // Verificar roles requeridos
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado: Permissão insuficiente' },
        { status: 403 }
      )
    }

    // Verificar acesso ao recurso
    if (!canAccess(user, request.nextUrl.pathname)) {
      return NextResponse.json(
        { error: 'Não autorizado: Recurso restrito' },
        { status: 403 }
      )
    }

    return NextResponse.next()
  }
}

/**
 * Helper para autenticação em API routes
 */
export async function requireAuth(request: NextRequest): Promise<UserWithRole> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error('Não autenticado', { cause: 'AUTH_REQUIRED' })
  }

  return session.user as UserWithRole
}

/**
 * Helper para verificar se é admin
 */
export async function isAdmin(request: NextRequest): Promise<UserWithRole> {
  const user = await requireAuth(request)
  if (user.role !== UserRole.ADMIN) {
    throw new Error('Não autorizado', { cause: 'ADMIN_REQUIRED' })
  }
  return user
}

/**
 * Helper para verificar se é agency ou admin
 */
export async function isAgencyOrAdmin(request: NextRequest): Promise<boolean> {
  const user = await requireAuth(request)
  return user.role === UserRole.AGENCY || user.role === UserRole.ADMIN
}

/**
 * Obtém usuário da sessão ou retorna erro
 */
export async function getUserOrThrow(request: NextRequest): Promise<UserWithRole> {
  return requireAuth(request)
}

/**
 * Verifica se usuário pode editar recurso de outro usuário
 */
export function canEditOtherUser(currentUser: UserWithRole, targetUserId: string): boolean {
  // Admin pode editar qualquer usuário
  if (currentUser.role === UserRole.ADMIN) return true

  // Agency pode editar usuários da sua agência (quando implementado)
  // Por enquanto, usuário só pode editar a si mesmo
  return currentUser.id === targetUserId
}

/**
 * Verifica se usuário pode visualizar analytics
 */
export function canViewAnalytics(user: UserWithRole): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.AGENCY
}

/**
 * Obtém limites baseados no role
 */
export function getLimitsByRole(role: UserRole): {
  maxLinks: number
  maxThemes: number
  canAccessAnalytics: boolean
  canCustomDomain: boolean
} {
  const limits = {
    [UserRole.USER]: {
      maxLinks: 5,
      maxThemes: 1,
      canAccessAnalytics: false,
      canCustomDomain: false,
    },
    [UserRole.AGENCY]: {
      maxLinks: 100,
      maxThemes: 50,
      canAccessAnalytics: true,
      canCustomDomain: false,
    },
    [UserRole.ADMIN]: {
      maxLinks: Infinity,
      maxThemes: Infinity,
      canAccessAnalytics: true,
      canCustomDomain: true,
    },
  }

  return limits[role]
}
