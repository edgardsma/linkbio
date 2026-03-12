/**
 * Script de desenvolvimento simples para iniciar o Next.js
 * O PostgreSQL deve estar rodando separadamente (via Docker ou nativo)
 * Este script apenas inicia o Next.js na porta padrão
 */

const { spawn } = require('child_process')
const path = require('path')

// Cores para output
const colors = {
  info: '\x1b[36m',    // Cyan
  next: '\x1b[32m',    // Green
  reset: '\x1b[0m'
}

console.log(`${colors.info}🚀 Iniciando LinkBio Brasil (Next.js Dev Server)${colors.reset}`)
console.log(`${colors.info}💡 Dica: Se o PostgreSQL não estiver rodando, inicie com:${colors.reset}`)
console.log(`   ${colors.next}docker-compose -f docker-compose.dev.yml up -d${colors.reset}`)
console.log(`   ${colors.next}ou npm run dev:docker${colors.reset}\n`)

const nextProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
})

nextProcess.on('error', (error) => {
  console.error(`${colors.reset}✗ Erro ao iniciar Next.js:${colors.reset}`, error.message)
  process.exit(1)
})

nextProcess.on('exit', (code) => {
  console.log(`\n${colors.info}✓ Next.js terminou${colors.reset}`)
  process.exit(code || 0)
})
