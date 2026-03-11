import { describe, it, expect } from '@jest/globals'
import { logger, authLogger, apiLogger, dbLogger, performanceLogger } from '../../../lib/logger'

describe('Logger', () => {
  it('deve ter método info', () => {
    expect(typeof logger.info).toBe('function')
  })

  it('deve ter método warn', () => {
    expect(typeof logger.warn).toBe('function')
  })

  it('deve ter método error', () => {
    expect(typeof logger.error).toBe('function')
  })

  it('deve ter método debug', () => {
    expect(typeof logger.debug).toBe('function')
  })

  it('deve ter método performance', () => {
    expect(typeof logger.performance).toBe('function')
  })

  it('deve registrar log info com contexto', () => {
    const spy = jest.spyOn(console, 'log')
    logger.info('Test message', { key: 'value' })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('deve registrar log error com erro', () => {
    const spy = jest.spyOn(console, 'error')
    const error = new Error('Test error')
    logger.error('Test error message', error)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('deve ter loggers específicos', () => {
    expect(authLogger).toBeDefined()
    expect(apiLogger).toBeDefined()
    expect(dbLogger).toBeDefined()
    expect(performanceLogger).toBeDefined()
  })
})
