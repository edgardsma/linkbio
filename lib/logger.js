/**
 * Logger Estruturado - LinkBio Brasil
 * Sistema de logging para registrar eventos, erros e métricas
 */

/**
 * Níveis de log
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
}

/**
 * Cores para output no console
 */
const colors = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  fatal: '\x1b[35m', // magenta
}

/**
 * Nomes dos níveis de log
 */
const levelNames = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
}

/**
 * Classe de Logger
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level !== undefined ? options.level : LogLevel.INFO
    this.prefix = options.prefix || ''
    this.enableColors = options.enableColors !== false
    this.enableFile = options.enableFile || false
    this.filePath = options.filePath || 'logs/app.log'
  }

  /**
   * Determina se um nível de log deve ser registrado
   */
  shouldLog(level) {
    return level >= this.level
  }

  /**
   * Formata o timestamp
   */
  getTimestamp() {
    return new Date().toISOString()
  }

  /**
   * Formata o objeto para exibição
   */
  formatObject(obj) {
    try {
      return JSON.stringify(obj, null, 2)
    } catch (error) {
      return '[Error: Object cannot be stringified]'
    }
  }

  /**
   * Formata a mensagem de log
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp()
    const levelName = levelNames[level]
    const prefix = this.prefix ? `[${this.prefix}] ` : ''

    let formatted = `${timestamp} ${prefix}${levelName}: ${message}`

    // Adicionar metadados se existirem
    if (Object.keys(meta).length > 0) {
      formatted += `\n${this.formatObject(meta)}`
    }

    return formatted
  }

  /**
   * Aplica cores ao nível de log
   */
  colorize(level, message) {
    if (!this.enableColors) {
      return message
    }

    const color = colors[levelNames[level].toLowerCase()]
    return `${color}${message}${colors.reset}`
  }

  /**
   * Registra uma mensagem de log
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return
    }

    const formatted = this.formatMessage(level, message, meta)

    // Console output
    const colorized = this.colorize(level, formatted)
    console.log(colorized)

    // File output (opcional)
    if (this.enableFile) {
      this.logToFile(formatted)
    }
  }

  /**
   * Registra no arquivo
   */
  async logToFile(message) {
    try {
      const fs = await import('fs/promises')
      await fs.appendFile(this.filePath, message + '\n')
    } catch (error) {
      // Ignorar erros de escrita em arquivo
    }
  }

  /**
   * Log de DEBUG
   */
  debug(message, meta) {
    this.log(LogLevel.DEBUG, message, meta)
  }

  /**
   * Log de INFO
   */
  info(message, meta) {
    this.log(LogLevel.INFO, message, meta)
  }

  /**
   * Log de WARN
   */
  warn(message, meta) {
    this.log(LogLevel.WARN, message, meta)
  }

  /**
   * Log de ERROR
   */
  error(message, meta) {
    this.log(LogLevel.ERROR, message, meta)
  }

  /**
   * Log de FATAL
   */
  fatal(message, meta) {
    this.log(LogLevel.FATAL, message, meta)
  }

  /**
   * Log de requisição HTTP
   */
  httpRequest(request) {
    const { method, url, headers } = request

    this.info('HTTP Request', {
      method,
      url,
      userAgent: headers.get('user-agent'),
      ip: headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown',
    })
  }

  /**
   * Log de resposta HTTP
   */
  httpResponse(request, status, duration) {
    const { method, url } = request

    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO

    this.log(level, 'HTTP Response', {
      method,
      url,
      status,
      duration: `${duration}ms`,
    })
  }

  /**
   * Log de erro de API
   */
  apiError(endpoint, error) {
    this.error(`API Error: ${endpoint}`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
  }

  /**
   * Log de autenticação
   */
  auth(action, userId, success = true) {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    this.log(level, `Auth: ${action}`, {
      userId,
      success,
    })
  }

  /**
   * Log de performance
   */
  performance(operation, duration, meta = {}) {
    this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...meta,
    })
  }
}

// ============================================
// Loggers Específicos
// ============================================

/**
 * Logger para autenticação
 */
export const authLogger = new Logger({
  level: LogLevel.INFO,
  prefix: 'AUTH',
  enableColors: true,
})

/**
 * Logger para API
 */
export const apiLogger = new Logger({
  level: LogLevel.INFO,
  prefix: 'API',
  enableColors: true,
})

/**
 * Logger para banco de dados
 */
export const dbLogger = new Logger({
  level: LogLevel.WARN,
  prefix: 'DB',
  enableColors: true,
})

/**
 * Logger para erros
 */
export const errorLogger = new Logger({
  level: LogLevel.ERROR,
  prefix: 'ERROR',
  enableColors: true,
})

/**
 * Logger para performance
 */
export const performanceLogger = new Logger({
  level: LogLevel.INFO,
  prefix: 'PERF',
  enableColors: true,
})

/**
 * Logger geral
 */
export const logger = new Logger({
  level: LogLevel.INFO,
  enableColors: true,
})

// ============================================
// Helpers
// ============================================

/**
 * Cria um logger personalizado
 */
export function createLogger(prefix, level = LogLevel.INFO) {
  return new Logger({
    level,
    prefix,
    enableColors: true,
  })
}

/**
 * Wrapper para capturar erros não tratados
 */
export function setupGlobalErrorHandlers() {
  // Capturar erros não tratados
  process.on('uncaughtException', (error) => {
    errorLogger.fatal('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    })
  })

  // Capturar promises rejeitadas não tratadas
  process.on('unhandledRejection', (reason, promise) => {
    errorLogger.fatal('Unhandled Rejection', {
      reason,
      promise,
    })
  })
}

// Configurar handlers globais
setupGlobalErrorHandlers()

export { Logger }
