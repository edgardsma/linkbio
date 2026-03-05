/**
 * Logger Estruturado - Arquitetura LinkHub
 *
 * Logger centralizado com suporte a:
 * - Diferentes níveis de log
 * - Contexto estruturado
 * - Request ID tracking
 * - Logs formatados em JSON
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  userId?: string
  requestId?: string
  error?: {
    message?: string
    stack?: string
    code?: string
  }
  performance?: {
    duration?: number
    operation?: string
  }
}

export interface LogContext {
  [key: string]: unknown
}

class Logger {
  private context: LogContext = {}

  /**
   * Define contexto global para este logger
   */
  setContext(key: string, value: unknown): void {
    this.context[key] = value
  }

  /**
   * Limpa todo o contexto
   */
  clearContext(): void {
    this.context = {}
  }

  /**
   * Adiciona contexto para um log específico
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    }

    console.log(JSON.stringify(entry))
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
    })
  }

  /**
   * Log de performance com duração
   */
  performance(
    operation: string,
    duration: number,
    metadata?: LogContext
  ): void {
    this.info(`Performance: ${operation}`, {
      performance: {
        duration,
        operation,
      },
      ...metadata,
    })
  }

  /**
   * Log com Request ID
   */
  withRequest(requestId: string): Logger {
    const logger = new Logger()
    logger.setContext('requestId', requestId)
    return logger
  }

  /**
   * Log com User ID
   */
  withUser(userId: string): Logger {
    const logger = new Logger()
    logger.setContext('userId', userId)
    return logger
  }
}

// Instância global
export const logger = new Logger()

// Criar loggers específicos
export const authLogger = new Logger()
export const apiLogger = new Logger()
export const dbLogger = new Logger()
export const performanceLogger = new Logger()
