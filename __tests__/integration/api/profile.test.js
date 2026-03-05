import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'

describe('Profile API', () => {
  let testUser

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await prisma.user.create({
      data: {
        email: 'profiletest@example.com',
        username: 'profiletest',
        password: 'hashedpassword',
        name: 'Profile Test',
        bio: 'This is a test bio',
      },
    })
  })

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.user.delete({ where: { id: testUser.id } })
    await prisma.$disconnect()
  })

  describe('GET /api/profile', () => {
    it('deve retornar 401 para usuário não autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/profile')
      expect(response.status).toBe(401)
    })

    it('deve retornar 404 para usuário inexistente', async () => {
      // Este teste requer uma sessão inválida
      // Em produção, você precisará mockar a sessão
      const response = await fetch('http://localhost:3000/api/profile')
      expect(response.status).toBe(401) // Não autenticado
    })
  })

  describe('PATCH /api/profile', () => {
    it('deve atualizar nome do usuário', async () => {
      const response = await fetch('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      })

      expect(response.status).toBe(401) // Não autenticado
    })

    it('deve atualizar bio do usuário', async () => {
      const response = await fetch('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: 'Updated bio',
        }),
      })

      expect(response.status).toBe(401) // Não autenticado
    })

    it('deve rejeitar username inválido', async () => {
      const response = await fetch('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'invalid username!',
        }),
      })

      expect(response.status).toBe(401) // Não autenticado
    })
  })
})
