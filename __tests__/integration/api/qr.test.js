import { GET } from '../../../app/api/qr/[username]/route'
import { createMocks } from 'node-mocks-http'
import QRCode from 'qrcode'
import { prisma } from '../../../lib/prisma'

// Mock dependencies
jest.mock('qrcode')
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: jest.fn()
        }
    }
}))

describe('QR API Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        process.env.NEXTAUTH_URL = 'http://localhost:3000'
    })

    it('should return 404 if user not found', async () => {
        prisma.user.findFirst.mockResolvedValue(null)

        const { req, res } = createMocks({
            method: 'GET',
            url: '/api/qr/nonexistent'
        })

        const response = await GET(req, { params: { username: 'nonexistent' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Usuário não encontrado')
    })

    it('should return 200 and a PNG buffer if user found', async () => {
        const mockUser = { id: 'user-1', username: 'testuser' }
        prisma.user.findFirst.mockResolvedValue(mockUser)

        // Simular buffer de imagem
        const mockBuffer = Buffer.from('mock-qr-code')
        QRCode.toBuffer.mockResolvedValue(mockBuffer)

        const { req, res } = createMocks({
            method: 'GET',
            url: '/api/qr/testuser'
        })

        const response = await GET(req, { params: { username: 'testuser' } })

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('image/png')

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        expect(buffer.toString()).toBe('mock-qr-code')

        expect(QRCode.toBuffer).toHaveBeenCalledWith(
            expect.stringContaining('testuser'),
            expect.any(Object)
        )
    })

    it('should handle @ in username', async () => {
        const mockUser = { id: 'user-1', username: 'testuser' }
        prisma.user.findFirst.mockResolvedValue(mockUser)
        QRCode.toBuffer.mockResolvedValue(Buffer.from('qr'))

        const { req, res } = createMocks({
            method: 'GET',
            url: '/api/qr/@testuser'
        })

        const response = await GET(req, { params: { username: '@testuser' } })

        expect(prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                username: expect.objectContaining({
                    equals: 'testuser'
                })
            })
        }))
        expect(response.status).toBe(200)
    })
})
