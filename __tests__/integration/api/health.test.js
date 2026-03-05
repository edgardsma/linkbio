import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'

describe('Health Check API', () => {
  beforeAll(async () => {
    // Setup antes de rodar os testes
  })

  afterAll(async () => {
    // Cleanup após rodar os testes
    await prisma.$disconnect()
  })

  it('deve retornar status 200', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    expect(response.status).toBe(200)
  })

  it('deve retornar status ok', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()
    expect(data.status).toBe('ok')
  })

  it('deve ter timestamp', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()
    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp)).toBeInstanceOf(Date)
  })

  it('deve ter uptime', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()
    expect(data.uptime).toBeDefined()
    expect(typeof data.uptime).toBe('number')
    expect(data.uptime).toBeGreaterThan(0)
  })

  it('deve ter checks de database', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()
    expect(data.checks).toBeDefined()
    expect(data.checks.database).toBeDefined()
  })
})
