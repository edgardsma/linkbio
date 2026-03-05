/**
 * Test Suite Completo do LinkBio Brasil
 * Testa todos os componentes do projeto: Banco, API, Frontend, etc.
 */

import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

/**
 * Teste 1: Conexão com o Banco de Dados
 */
async function testDatabaseConnection() {
  console.log('\n' + colors.blue + '📊 Teste 1: Conexão com o Banco de Dados' + colors.reset)

  try {
    // Testar conexão básica
    await prisma.$connect()

    console.log(colors.green + '✅ Conexão com o banco estabelecida' + colors.reset)

    // Verificar tabelas principais
    const userCount = await prisma.user.count()
    const linkCount = await prisma.link.count()
    const themeCount = await prisma.theme.count()

    console.log(`   Usuários: ${userCount}`)
    console.log(`   Links: ${linkCount}`)
    console.log(`   Temas: ${themeCount}`)

    await prisma.$disconnect()

    return { success: true, details: { userCount, linkCount, themeCount } }
  } catch (error) {
    console.error(colors.red + '❌ Erro na conexão:' + colors.reset)
    console.error(error)
    return { success: false, error: error.message }
  }
}

/**
 * Teste 2: Migrações do Prisma
 */
async function testMigrations() {
  console.log('\n' + colors.blue + '📦 Teste 2: Migrações do Prisma' + colors.reset)

  try {
    // Verificar se as tabelas principais existem
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `

    const requiredTables = ['User', 'Link', 'Theme', 'Click', 'Subscription']
    const existingTables = tables.map(t => t.table_name)
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))

    if (missingTables.length > 0) {
      console.log(colors.yellow + '⚠️  Tabelas faltando:' + colors.reset)
      missingTables.forEach(table => console.log(`   - ${table}`))
      return { success: false, missingTables }
    }

    console.log(colors.green + '✅ Todas as tabelas necessárias existem' + colors.reset)
    console.log(`   Tabelas verificadas: ${requiredTables.join(', ')}`)

    return { success: true, tables: existingTables }
  } catch (error) {
    console.error(colors.red + '❌ Erro ao verificar migrações:' + colors.reset)
    console.error(error)
    return { success: false, error: error.message }
  }
}

/**
 * Teste 3: API Endpoints (apenas públicos)
 */
async function testAPIEndpoints() {
  console.log('\n' + colors.blue + '🌐 Teste 3: API Endpoints' + colors.reset)

  // Definir apenas endpoints públicos para testar
  const endpoints = [
    { method: 'GET', path: '/api/themes', name: 'Listar temas' },
    { method: 'GET', path: '/api/qr/testeadmin', name: 'QR Code' },
    { method: 'POST', path: '/api/seed', name: 'Seed de temas' },
  ]

  const results = []

  for (const endpoint of endpoints) {
    try {
      console.log(colors.blue + `📡 ${endpoint.name}: ${endpoint.method} ${endpoint.path}` + colors.reset)

      const headers = {
        'Content-Type': 'application/json',
      }

      const response = await fetch(`http://localhost:3000${endpoint.path}`, {
        method: endpoint.method,
        headers,
      })

      // Tratar respostas de imagem (QR Code)
      const contentType = response.headers.get('content-type')

      if (contentType && contentType.includes('image/')) {
        if (response.ok) {
          console.log(colors.green + `   ✅ Status: ${response.status}` + colors.reset)
          console.log(`   Imagem PNG gerada com sucesso`)
          results.push({ endpoint: endpoint.name, success: true })
        } else {
          console.log(colors.red + `   ❌ Status: ${response.status}` + colors.reset)
          results.push({ endpoint: endpoint.name, success: false })
        }
      } else {
        const data = await response.json()

        if (response.ok) {
          console.log(colors.green + `   ✅ Status: ${response.status}` + colors.reset)
          console.log(`   ${JSON.stringify(data).substring(0, 100)}...`)
          results.push({ endpoint: endpoint.name, success: true })
        } else {
          console.log(colors.red + `   ❌ Status: ${response.status}` + colors.reset)
          console.log(`   Error: ${data.error}`)
          results.push({ endpoint: endpoint.name, success: false })
        }
      }
    } catch (error) {
      console.error(colors.red + `   ❌ Erro: ${error.message}` + colors.reset)
      results.push({ endpoint: endpoint.name, success: false })
    }
  }

  const successCount = results.filter(r => r.success).length
  const totalCount = results.length

  console.log(colors.blue + `\n📊 Resumo da API:` + colors.reset)
  console.log(`   Sucesso: ${successCount}/${totalCount}`)
  console.log(`   Taxa de sucesso: ${((successCount / totalCount) * 100).toFixed(1)}%`)

  return { success: successCount === totalCount, results }
}

/**
 * Teste 4: Página Pública do Usuário
 */
async function testPublicPage() {
  console.log('\n' + colors.blue + '📄 Teste 4: Página Pública' + colors.reset)

  try {
    const response = await fetch('http://localhost:3000/testeadmin')

    if (!response.ok) {
      console.log(colors.red + `� Erro ao carregar página: ${response.status}` + colors.reset)
      return { success: false, status: response.status }
    }

    const html = await response.text()

    // Verificar elementos principais
    const checks = {
      'Container principal': html.includes('container mx-auto'),
      'Links container': html.includes('space-y-4'),
    }

    console.log(colors.green + '✅ Página carregada com sucesso' + colors.reset)

    Object.entries(checks).forEach(([name, found]) => {
      console.log(`   ${found ? colors.green + '✅' : colors.red + '❌'} ${name}` + colors.reset)
    })

    const allPassed = Object.values(checks).every(Boolean)

    return { success: allPassed, checks }
  } catch (error) {
    console.error(colors.red + '❌ Erro ao carregar página:' + colors.reset)
    console.error(error)
    return { success: false, error: error.message }
  }
}

/**
 * Teste 5: Performance - Múltiplas Requisições
 */
async function testPerformance() {
  console.log('\n' + colors.blue + '⚡ Teste 5: Performance' + colors.reset)

  const endpoints = [
    '/api/themes',
    '/testeadmin',
    '/api/qr/testeadmin',
  ]

  const results = []

  for (const endpoint of endpoints) {
    console.log(`🔄 Testando: ${endpoint}`)

    const times = []

    for (let i = 0; i < 5; i++) {
      const start = Date.now()

      try {
        const response = await fetch(`http://localhost:3000${endpoint}`)
        await (response.headers.get('content-type')?.includes('image/')
          ? response.arrayBuffer()
          : response.text()
        )

        const duration = Date.now() - start
        times.push(duration)
      } catch (error) {
        console.error(colors.red + `   ❌ Erro: ${error.message}` + colors.reset)
      }
    }

    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      const max = Math.max(...times)
      const min = Math.min(...times)

      console.log(colors.green + `   ✅ Média: ${avg.toFixed(0)}ms (min: ${min}ms, max: ${max}ms)` + colors.reset)
      results.push({ endpoint, avg, min, max })
    }
  }

  return { success: results.length > 0, results }
}

/**
 * Teste 6: Links Públicos (sem autenticação)
 */
async function testPublicLinks() {
  console.log('\n' + colors.blue + '🔗 Teste 6: Verificar Links Públicos' + colors.reset)

  try {
    const response = await fetch('http://localhost:3000/testeadmin')

    if (!response.ok) {
      console.log(colors.red + `❌ Erro ao carregar página: ${response.status}` + colors.reset)
      return { success: false, status: response.status }
    }

    const html = await response.text()

    // Verificar se a página carregou corretamente
    const checks = {
      'Página carregada': html.includes('html'),
      'Container principal': html.includes('container'),
    }

    console.log(colors.green + '✅ Página pública verificada' + colors.reset)

    Object.entries(checks).forEach(([name, found]) => {
      console.log(`   ${found ? colors.green + '✅' : colors.red + '❌'} ${name}` + colors.reset)
    })

    const allPassed = Object.values(checks).every(Boolean)

    return { success: allPassed, checks }
  } catch (error) {
    console.error(colors.red + '❌ Erro ao verificar links públicos:' + colors.reset)
    console.error(error)
    return { success: false, error: error.message }
  }
}

/**
 * Função Principal de Execução
 */
async function runAllTests() {
  console.log(colors.cyan + '='.repeat(50) + colors.reset)
  console.log(colors.cyan + '  LinkBio Brasil - Test Suite Completo' + colors.reset)
  console.log(colors.cyan + '='.repeat(50) + colors.reset)

  const startTime = Date.now()
  const results = []

  // Executar todos os testes
  results.push(await testDatabaseConnection())
  results.push(await testMigrations())
  results.push(await testAPIEndpoints())
  results.push(await testPublicPage())
  results.push(await testPerformance())
  results.push(await testPublicLinks())

  const duration = Date.now() - startTime
  const successCount = results.filter(r => r.success).length

  // Resumo final
  console.log('\n' + colors.cyan + '='.repeat(50) + colors.reset)
  console.log(colors.cyan + '  📊 Resumo dos Testes' + colors.reset)
  console.log(colors.cyan + '='.repeat(50) + colors.reset)

  results.forEach((result, index) => {
    const status = result.success
      ? colors.green + '✅ PASSOU' + colors.reset
      : colors.red + '❌ FALHOU' + colors.reset

    console.log(`Teste ${index + 1}: ${status}`)
  })

  console.log(colors.blue + '\n📈 Estatísticas:' + colors.reset)
  console.log(`   Total de testes: ${results.length}`)
  console.log(`   Testes passados: ${successCount}`)
  console.log(`   Testes falhados: ${results.length - successCount}`)
  console.log(`   Taxa de sucesso: ${((successCount / results.length) * 100).toFixed(1)}%`)
  console.log(`   Duração total: ${(duration / 1000).toFixed(2)}s`)

  // Desconectar do banco
  await prisma.$disconnect()

  // Código de saída
  process.exit(successCount === results.length ? 0 : 1)
}

// Executar todos os testes
runAllTests().catch((error) => {
  console.error(colors.red + '\n❌ Erro fatal na execução dos testes:' + colors.reset)
  console.error(error)
  process.exit(1)
})
