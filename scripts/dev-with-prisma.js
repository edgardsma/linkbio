/**
 * Script de desenvolvimento que inicia Docker Compose e Next.js juntos
 * Inicia PostgreSQL e Redis via Docker Compose, depois inicia o Next.js
 * Quando o Next.js terminar, para o Docker Compose
 */

const { spawn, exec } = require('child_process')
const path = require('path')

// Cores para output
const colors = {
  docker: '\x1b[35m', // Magenta
  next: '\x1b[36m',    // Cyan
  reset: '\x1b[0m'
}

// Flag para rastrear se o Docker já iniciou
let dockerStarted = false
let dockerProcess = null

// Função para iniciar o Docker Compose
function startDocker() {
  console.log(`${colors.docker}🐳 Iniciando Docker Compose (PostgreSQL + Redis)...${colors.reset}`)

  dockerProcess = spawn('docker-compose', ['-f', 'docker-compose.dev.yml', 'up', '-d'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  })

  // Output do Docker
  dockerProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log(`${colors.docker}[Docker] ${output.trim()}${colors.reset}`)

    if (!dockerStarted && (output.includes('Started') || output.includes('healthy'))) {
      dockerStarted = true
      console.log(`${colors.docker}✓ Docker Compose iniciado com sucesso!${colors.reset}`)
    }
  })

  dockerProcess.stderr.on('data', (data) => {
    const output = data.toString()
    console.log(`${colors.docker}[Docker ERROR] ${output.trim()}${colors.reset}`)
  })

  dockerProcess.on('error', (error) => {
    console.error(`${colors.docker}✗ Erro ao iniciar Docker:${colors.reset}`, error.message)
    process.exit(1)
  })

  dockerProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${colors.docker}✗ Docker terminou com código ${code}${colors.reset}`)
    }
  })
}

// Função para verificar se o Docker está rodando
function checkDockerRunning() {
  return new Promise((resolve) => {
    exec('docker-compose -f docker-compose.dev.yml ps', {
      cwd: path.join(__dirname, '..'),
      shell: true
    }, (error, stdout, stderr) => {
      if (error) {
        resolve(false)
      } else {
        const output = stdout + stderr
        // Verificar se há serviços rodando (State = Up)
        resolve(output.includes('Up'))
      }
    })
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
    // Parar Docker se houver erro
    if (dockerProcess) {
      stopDocker()
    }
    process.exit(1)
  })

  nextProcess.on('exit', (code) => {
    console.log(`\n${colors.next}✓ Next.js terminou${colors.reset}`)

    // Parar Docker quando Next.js terminar
    if (dockerProcess) {
      console.log(`${colors.docker}🛑 Parando Docker Compose...${colors.reset}`)
      stopDocker()
    }

    process.exit(code || 0)
  })
}

// Função para parar o Docker Compose
function stopDocker() {
  spawn('docker-compose', ['-f', 'docker-compose.dev.yml', 'down'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  })
}

// Fluxo principal
async function main() {
  // Verificar se Docker já está rodando
  const isRunning = await checkDockerRunning()

  if (isRunning) {
    console.log(`${colors.docker}✓ Docker Compose já está rodando!${colors.reset}`)
    dockerStarted = true
    // Iniciar Next.js diretamente
    startNext()
  } else {
    // Iniciar Docker primeiro
    startDocker()

    // Esperar Docker iniciar e ficar saudável
    console.log(`${colors.docker}⏳ Aguardando PostgreSQL e Redis ficarem saudáveis...${colors.reset}`)
    setTimeout(() => {
      if (!dockerStarted) {
        console.log(`${colors.docker}⚠️  Docker ainda não iniciou totalmente, mas continuando...${colors.reset}`)
      }
      // Iniciar Next.js independente do status do Docker
      startNext()
    }, 8000) // Esperar 8 segundos
  }
}

// Tratamento de sinais para limpar
process.on('SIGINT', () => {
  console.log(`\n${colors.reset}⚠️  Interrupção recebida...`)

  if (dockerProcess) {
    console.log(`${colors.docker}🛑 Parando Docker Compose...${colors.reset}`)
    stopDocker()
  }

  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log(`\n${colors.reset}⚠️  Termination recebido...`)

  if (dockerProcess) {
    console.log(`${colors.docker}🛑 Parando Docker Compose...${colors.reset}`)
    stopDocker()
  }

  process.exit(0)
})

// Iniciar
main().catch(error => {
  console.error('Erro ao iniciar:', error)
  process.exit(1)
})
