import { PrismaClient } from '@prisma/client'
import { dbLogger } from '@/lib/logger.js'

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Log inicialização do Prisma
if (!globalForPrisma.prisma) {
  dbLogger.info('Prisma client inicializado', {
    environment: process.env.NODE_ENV || 'unknown',
  })
}

// Log de conexão bem-sucedida
prisma.$connect()
  .then(() => {
    dbLogger.info('Conexão com banco de dados estabelecida', {
      environment: process.env.NODE_ENV || 'unknown',
    })
  })
  .catch((error) => {
    dbLogger.error('Erro ao conectar ao banco de dados', error)
  })

export { prisma }
export default prisma
