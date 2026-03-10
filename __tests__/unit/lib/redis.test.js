import { getUserProfile, checkRateLimit } from '../../../lib/redis'
import { Redis } from '@upstash/redis'
import { prisma } from '../../../lib/prisma'

// Mock as dependências
jest.mock('@upstash/redis', () => {
    return {
        Redis: jest.fn().mockImplementation(() => ({
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            setex: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn()
        }))
    }
})

jest.mock('../../../lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn()
        }
    }
}))

describe('Redis Cache Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    // Esse teste simula o comportamento da conexão Upstash vazia no desenvolvimento local
    describe('getUserProfile', () => {
        it('should fallback to Prisma if Redis config is missing', async () => {
            // Configurou variáveis ​​vazias
            process.env.UPSTASH_REDIS_REST_URL = ''
            process.env.UPSTASH_REDIS_REST_TOKEN = ''

            const mockUserProfile = { id: 'user-1', username: 'testuser' }
            prisma.user.findUnique.mockResolvedValue(mockUserProfile)

            const result = await getUserProfile('testuser')

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'testuser' },
                include: { links: true },
            })

            expect(result).toEqual(mockUserProfile)
        })
    })
})
