/**
 * Logger Estruturado - LinkBio Brasil
 *
 * Logger centralizado com suporte a:
 * - Níveis de log (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Prefixo por contexto (AUTH, API, DB, PERF)
 * - Cores no console (desenvolvimento)
 * - Output JSON estruturado (produção)
 * - Request ID tracking
 */

// ============================================
// Tipos
// ============================================

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
} as const

export type LogLevelValue = (typeof LogLevel)[keyof typeof LogLevel]

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  prefix?: string
  context?: Record<string, unknown>
  error?: {
    message?: string
    stack?: string
    code?: string
  }
  performance?: {
    duration?: number | string
    operation?: string
  }
}

export interface LoggerOptions {
  level?: LogLevelValue
  prefix?: string
  enableColors?: boolean
}

// ============================================
// Internos
// ============================================

const colors: Record<string, string> = {
  reset: '\x1b[0m',
  debug: '\x1b[36m',   // cyan
  info: '\x1b[32m',    // green
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
  fatal: '\x1b[35m',   // magenta
}

const levelNames: Record<LogLevelValue, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
}

const isProduction = process.env.NODE_ENV === 'production'

// ============================================
// Classe Logger
// ============================================

class Logger {
  private level: LogLevelValue
  private prefix: string
  private enableColors: boolean

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO
    this.prefix = options.prefix || ''
    this.enableColors = options.enableColors !== false && !isProduction
  }

  private shouldLog(level: LogLevelValue): boolean {
    return level >= this.level
  }

  private formatMessage(
    level: LogLevelValue,
    message: string,
    meta: Record<string, unknown> = {}
  ): string {
    const timestamp = new Date().toISOString()
    const levelName = levelNames[level]
    const prefix = this.prefix ? `[${this.prefix}] ` : ''

    if (isProduction) {
      // JSON estruturado em produção
      const entry: LogEntry = { timestamp, level: levelName, message }
      if (this.prefix) entry.prefix = this.prefix
      if (Object.keys(meta).length > 0) entry.context = meta
      return JSON.stringify(entry)
    }

    let formatted = `${timestamp} ${prefix}${levelName}: ${message}`
    if (Object.keys(meta).length > 0) {
      formatted += `\n${JSON.stringify(meta, null, 2)}`
    }
    return formatted
  }

  private colorize(level: LogLevelValue, message: string): string {
    if (!this.enableColors) return message
    const color = colors[levelNames[level].toLowerCase()]
    return `${color}${message}${colors.reset}`
  }

  private log(level: LogLevelValue, message: string, meta: Record<string, unknown> = {}): void {
    if (!this.shouldLog(level)) return
    const formatted = this.formatMessage(level, message, meta)
    const output = this.colorize(level, formatted)
    if (level >= LogLevel.ERROR) {
      console.error(output)
    } else {
      console.log(output)
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta)
  }

  /**
   * Aceita (message, error, context) ou (message, context) para compatibilidade
   */
  error(message: string, errorOrMeta?: Error | unknown, context?: Record<string, unknown>): void {
    const meta: Record<string, unknown> = { ...context }
    if (errorOrMeta instanceof Error) {
      meta.error = { message: errorOrMeta.message, stack: errorOrMeta.stack, code: (errorOrMeta as any).code }
    } else if (errorOrMeta && typeof errorOrMeta === 'object') {
      Object.assign(meta, errorOrMeta)
    }
    this.log(LogLevel.ERROR, message, meta)
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, meta)
  }

  performance(operation: string, duration: number | string, meta?: Record<string, unknown>): void {
    this.info(`Performance: ${operation}`, {
      performance: { duration: typeof duration === 'number' ? `${duration}ms` : duration, operation },
      ...meta,
    })
  }

  /**
   * Log de requisição HTTP
   */
  httpRequest(request: Request): void {
    this.info('HTTP Request', {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    })
  }

  httpResponse(request: Request, status: number, duration: number): void {
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, 'HTTP Response', {
      method: request.method,
      url: request.url,
      status,
      duration: `${duration}ms`,
    })
  }

  auth(action: string, userId?: string, success = true): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    this.log(level, `Auth: ${action}`, { userId, success })
  }
}

// ============================================
// Instâncias Exportadas
// ============================================

export const logger = new Logger({ level: LogLevel.INFO })

export const authLogger = new Logger({ level: LogLevel.INFO, prefix: 'AUTH' })

export const apiLogger = new Logger({ level: LogLevel.INFO, prefix: 'API' })

export const dbLogger = new Logger({ level: LogLevel.WARN, prefix: 'DB' })

export const performanceLogger = new Logger({ level: LogLevel.INFO, prefix: 'PERF' })

export const errorLogger = new Logger({ level: LogLevel.ERROR, prefix: 'ERROR' })

export function createLogger(prefix: string, level: LogLevelValue = LogLevel.INFO): Logger {
  return new Logger({ level, prefix })
}

export { Logger }
