import { describe, it, expect } from '@jest/globals'
import { UserRole, hasRole, hasAnyRole, canAccess, getLimitsByRole } from '@/lib/auth'

describe('RBAC - Auth Helpers', () => {
  describe('UserRole enum', () => {
    it('deve ter USER', () => {
      expect(UserRole.USER).toBe('user')
    })

    it('deve ter ADMIN', () => {
      expect(UserRole.ADMIN).toBe('admin')
    })

    it('deve ter AGENCY', () => {
      expect(UserRole.AGENCY).toBe('agency')
    })
  })

  describe('hasRole', () => {
    it('deve retornar true para role correspondente', () => {
      const user = { role: UserRole.ADMIN }
      expect(hasRole(user, UserRole.ADMIN)).toBe(true)
    })

    it('deve retornar false para role diferente', () => {
      const user = { role: UserRole.USER }
      expect(hasRole(user, UserRole.ADMIN)).toBe(false)
    })

    it('deve retornar true para admin em qualquer verificação', () => {
      const user = { role: UserRole.ADMIN }
      expect(hasRole(user, UserRole.USER)).toBe(true)
      expect(hasRole(user, UserRole.AGENCY)).toBe(true)
    })
  })

  describe('hasAnyRole', () => {
    it('deve retornar true se usuário tem uma das roles', () => {
      const user = { role: UserRole.USER }
      expect(hasAnyRole(user, [UserRole.USER, UserRole.ADMIN])).toBe(true)
    })

    it('deve retornar false se usuário não tem nenhuma das roles', () => {
      const user = { role: UserRole.USER }
      expect(hasAnyRole(user, [UserRole.ADMIN, UserRole.AGENCY])).toBe(false)
    })

    it('deve retornar true para admin em qualquer lista', () => {
      const user = { role: UserRole.ADMIN }
      expect(hasAnyRole(user, [UserRole.USER, UserRole.AGENCY])).toBe(true)
    })
  })

  describe('canAccess', () => {
    it('deve permitir acesso a recursos públicos', () => {
      const user = { role: UserRole.USER }
      expect(canAccess(user, '/api/links')).toBe(true)
    })

    it('deve permitir acesso para admin', () => {
      const user = { role: UserRole.ADMIN }
      expect(canAccess(user, '/api/admin/*')).toBe(true)
    })

    it('deve negar acesso para usuários em recursos restritos', () => {
      const user = { role: UserRole.USER }
      expect(canAccess(user, '/api/admin/*')).toBe(false)
    })
  })

  describe('getLimitsByRole', () => {
    it('deve retornar limites para USER', () => {
      const limits = getLimitsByRole(UserRole.USER)
      expect(limits.maxLinks).toBeDefined()
      expect(limits.maxThemes).toBeDefined()
      expect(limits.hasAnalytics).toBeDefined()
      expect(limits.hasCustomDomain).toBe(false)
    })

    it('deve retornar limites para ADMIN', () => {
      const limits = getLimitsByRole(UserRole.ADMIN)
      expect(limits.maxLinks).toBe(-1) // Ilimitado
      expect(limits.maxThemes).toBe(-1)
      expect(limits.hasCustomDomain).toBe(true)
    })

    it('deve retornar limites para AGENCY', () => {
      const limits = getLimitsByRole(UserRole.AGENCY)
      expect(limits.maxLinks).toBe(-1)
      expect(limits.hasAnalytics).toBe(true)
      expect(limits.hasCustomDomain).toBe(true)
    })
  })
})
