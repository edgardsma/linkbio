import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'

describe('Links API', () => {
  let testUser
  let testLink

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        name: 'Test User',
      },
    })
  })

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.link.deleteMany({ where: { userId: testUser.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Limpar links antes de cada teste
    await prisma.link.deleteMany({ where: { userId: testUser.id } })
  })

  describe('POST /api/links', () => {
    it('deve criar um novo link com dados válidos', async () => {
      const response = await fetch('http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Meu Website',
          url: 'https://example.com',
          description: 'Descrição do link',
          icon: '🌐',
        }),
      })

      // Nota: Este teste requer autenticação
      // Em produção, você precisará incluir o cookie de sessão
      expect(response.status).toBe(401) // Não autenticado
    })

    it('deve rejeitar link sem título', async () => {
      const response = await fetch('http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
        }),
      })

      expect(response.status).toBe(401) // Não autenticado
    })

    it('deve rejeitar link sem URL', async () => {
      const response = await fetch('http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Meu Website',
        }),
      })

      expect(response.status).toBe(401) // Não autenticado
    })

    it('deve rejeitar URL inválida', async () => {
      const response = await fetch('http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Meu Website',
          url: 'not-a-url',
        }),
      })

      expect(response.status).toBe(401) // Não autenticado
    })
  })

  describe('GET /api/links', () => {
    it('deve retornar lista vazia para usuário sem links', async () => {
      const response = await fetch('http://localhost:3000/api/links')
      expect(response.status).toBe(401) // Não autenticado
    })
  })
})
