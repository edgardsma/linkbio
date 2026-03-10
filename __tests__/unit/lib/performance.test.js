import { trackPerformance } from '../../../lib/performance'
import { logger } from '../../../lib/logger'

// Mock do logger para não sujar o console de testes
jest.mock('../../../lib/logger', () => ({
    logger: {
        performance: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        info: jest.fn()
    }
}))

describe('Performance Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('trackPerformance', () => {
        it('should execute the callback and return its result', async () => {
            const mockOperation = jest.fn().mockResolvedValue('success')

            const result = await trackPerformance('test-op', mockOperation)

            expect(result).toBe('success')
            expect(mockOperation).toHaveBeenCalled()
        })

        it('should log execution time when successful', async () => {
            const mockOperation = jest.fn().mockImplementation(() => {
                jest.advanceTimersByTime(100) // Simula 100ms
                return Promise.resolve('data')
            })

            const thresholds = { warning: 200, critical: 500 }
            await trackPerformance('fast-op', mockOperation, {}, thresholds)

            expect(logger.debug).toHaveBeenCalledWith(
                'Performance OK: fast-op',
                expect.objectContaining({
                    duration: expect.any(Number)
                })
            )
        })

        it('should throw error and log if operation fails', async () => {
            const testError = new Error('Database connection failed')
            const mockOperation = jest.fn().mockRejectedValue(testError)

            try {
                await trackPerformance('failing-op', mockOperation)
            } catch (err) {
                expect(err.message).toBe('Database connection failed')
            }

            expect(logger.error).toHaveBeenCalledWith(
                'Performance erro: failing-op',
                testError,
                expect.any(Object)
            )
        })
    })
})
