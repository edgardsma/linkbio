/**
 * Script de desenvolvimento que inicia Prisma e Next.js juntos
 * Inicia o Prisma Dev em background e depois inicia o Next.js
 * Quando o Next.js terminar, mata o Prisma Dev
 */

const { spawn } = require('child_process')
const path = require('path')

// Cores para output
const colors = {
  prisma: '\x1b[35m', // Magenta
  next: '\x1b[36m',    // Cyan
  reset: '\x1b[0m'
}

// Flag para rastrear se o Prisma já iniciou
let prismaStarted = false
let prismaProcess = null

// Função para iniciar o Prisma Dev
function startPrisma() {
  console.log(`${colors.prisma}🗄  Iniciando Prisma Dev...${colors.reset}`)

  prismaProcess = spawn('npx', ['prisma', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  })

  // Output do Prisma (apenas quando iniciar com sucesso)
  prismaProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log(`${colors.prisma}[Prisma] ${output.trim()}${colors.reset}`)

    if (!prismaStarted && (output.includes('Running') || output.includes('Started'))) {
      prismaStarted = true
      console.log(`${colors.prisma}✓ Prisma Dev iniciado com sucesso!${colors.reset}`)
    }
  })

  prismaProcess.stderr.on('data', (data) => {
    const output = data.toString()
    console.log(`${colors.prisma}[Prisma ERROR] ${output.trim()}${colors.reset}`)
  })

  prismaProcess.on('error', (error) => {
    console.error(`${colors.prisma}✗ Erro ao iniciar Prisma:${colors.reset}`, error.message)
    process.exit(1)
  })

  prismaProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${colors.prisma}✗ Prisma terminou com código ${code}${colors.reset}`)
    }
  })
}

// Função para iniciar o Next.js
function startNext() {
  console.log(`${colors.next}🚀 Iniciando Next.js...${colors.reset}`)

  const nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  })

  nextProcess.on('error', (error) => {
    console.error(`${colors.next}✗ Erro ao iniciar Next.js:${colors.reset}`, error.message)
    // Matar Prisma se houver erro
    if (prismaProcess) {
      prismaProcess.kill()
    }
    process.exit(1)
  })

  nextProcess.on('exit', (code) => {
    console.log(`\n${colors.next}✓ Next.js terminou${colors.reset}`)

    // Matar Prisma quando Next.js terminar
    if (prismaProcess) {
      console.log(`${colors.prisma}🛑 Parando Prisma Dev...${colors.reset}`)
      prismaProcess.kill()
    }

    process.exit(code || 0)
  })
}

// Iniciar Prisma primeiro
startPrisma()

// Esperar um pouco para o Prisma iniciar
setTimeout(() => {
  if (!prismaStarted) {
    console.log(`${colors.prisma}⚠️  Prisma ainda não iniciou, mas continuando...${colors.reset}`)
  }
  // Iniciar Next.js independente do status do Prisma
  startNext()
}, 3000) // Esperar 3 segundos

// Tratamento de sinais para limpar
process.on('SIGINT', () => {
  console.log(`\n${colors.reset}⚠️  Interrupção recebida...`)

  if (prismaProcess) {
    console.log(`${colors.prisma}🛑 Parando Prisma Dev...${colors.reset}`)
    prismaProcess.kill()
  }

  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log(`\n${colors.reset}⚠️  Termination recebido...`)

  if (prismaProcess) {
    console.log(`${colors.prisma}🛑 Parando Prisma Dev...${colors.reset}`)
    prismaProcess.kill()
  }

  process.exit(0)
})
