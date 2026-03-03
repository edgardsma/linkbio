#!/usr/bin/env node

/**
 * Script de Testes - LinkBio Brasil
 * Executa testes automatizados para verificar o funcionamento do sistema
 */

const prisma = require('../lib/prisma')
const bcrypt = require('bcryptjs')

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
}

console.log('='.repeat(50))

/**
 * Teste de Conexão com o Banco de Dados
 */
async function testDatabaseConnection() {
  console.log('📊 Testando conexão com o banco de dados...')

  try {
    // Testar conexão com Prisma
    await prisma.$connect()
    const userCount = await prisma.user.count()
    const linkCount = await prisma.link.count()

    console.log(colors.green + '✅ Conexão com banco: OK' + colors.reset)
    console.log(`   Total de usuários: ${userCount}`)
    console.log(`   Total de links: ${linkCount}`)

    return { success: true, userCount, linkCount }
  } catch (error) {
    console.error(colors.red + '❌ Erro de conexão com banco:' + colors.reset)
    console.error(error)
    return { success: false }
  }
}

/**
 * Teste de Migrations
 */
async function testMigrations() {
  console.log('📊 Testando migrations...')

  try {
    // Verificar se schema está sincronizado
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT schema_migrations_version FROM schema_migrations LIMIT 1`

    console.log(colors.green + '✅ Migrations sincronizadas' + colors.reset)
    console.log(`   Versão: ${result[0].schema_migrations_version}`)

    return { success: true }
  } catch (error) {
    console.error(colors.red + '❌ Erro ao testar migrations:' + colors.reset)
    console.error(error)
    return { success: false }
  }
}

/**
 * Teste de Temas
 */
async function testThemes() {
  console.log('🎨 Testando sistema de temas...')

  try {
    await prisma.$connect()

    // Contar temas
    const themeCount = await prisma.theme.count()
    const premiumCount = await prisma.theme.count({
      where: { isPremium: true }
    })

    console.log(colors.green + '✅ Sistema de temas: OK' + colors.reset)
    console.log(`   Total de temas: ${themeCount}`)
    console.log(`   Temas premium: ${premiumCount}`)
    console.log(`   Temas gratuitos: ${themeCount - premiumCount}`)

    // Listar alguns temas para verificação
    const themes = await prisma.theme.findMany({
      take: 3,
      orderBy: { name: 'asc' },
    })

    console.log(colors.blue + '📋 Exemplo de temas:' + colors.reset)
    themes.forEach(theme => {
      const status = theme.isPremium ? 'PRO' : 'FREE'
      console.log(`   [${status}] ${theme.name} - ${theme.description}`)
    })

    return { success: true, themeCount, premiumCount }
  } catch (error) {
    console.error(colors.red + '❌ Erro ao testar temas:' + colors.reset)
    console.error(error)
    return { success: false }
  }
}

/**
 * Teste de Endpoints da API
 */
async function testAPIEndpoints() {
  console.log('🌐 Testando endpoints da API...')

  const endpoints = [
    { method: 'GET', path: '/api/themes', name: 'Listar temas' },
    { method: 'GET', path: '/api/analytics', name: 'Analytics' },
  { method: 'GET', path: '/api/qr/joaoteste', name: 'QR Code' },
    { method: 'POST', path: '/api/seed', name: 'Seed de temas' },
  ]

  const results = []

  for (const endpoint of endpoints) {
    try {
      console.log(colors.blue + `📡 ${endpoint.name}: ${endpoint.method} ${endpoint.path}` + colors.reset)

      const response = await fetch(`http://localhost:3000${endpoint.path}`, {
        method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      ...(endpoint.method === 'POST' && { body: JSON.stringify({}) }),
      })

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
 * Teste de Página Pública
 */
async function testPublicPage() {
  console.log('🌐 Testando página pública...')

  try {
    // Buscar um usuário de teste
    await prisma.$connect()

    const testUser = await prisma.user.findFirst({
      where: {
        username: 'testeadmin',
      },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!testUser) {
      console.log(colors.yellow + '⚠️  Usuário de teste não encontrado' + colors.reset)
      console.log('   Criando usuário de teste...')

      // Criar usuário de teste
      await prisma.user.create({
        data: {
          name: 'Admin de Teste',
          username: 'testeadmin',
          email: 'teste@linkbio.com',
          password: await bcrypt.hash('teste123', 12),
          bio: 'Usuário para testes automatizados',
          primaryColor: '#667eea',
        },
      })

      console.log(colors.green + '✅ Usuário de teste criado' + colors.reset)
    }

    // Buscar usuário novamente
    const user = await prisma.user.findFirst({
      where: { username: 'testeadmin' },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!user) {
      throw new Error('Usuário não encontrado após criação')
    }

    console.log(colors.green + '✅ Usuário encontrado: ' + user.username + colors.reset)
    console.log(`   Links ativos: ${user.links.length}`)

    // Testar URLs de links
    let validLinks = 0
    user.links.forEach(link => {
      if (link.type === 'url' && link.url.startsWith('http')) {
        validLinks++
      }
    })

    console.log(colors.green + `✅ Links válidos: ${validLinks}/${user.links.length}` + colors.reset)

    return { success: true, user }
  } catch (error) {
    console.error(colors.red + '❌ Erro ao testar página pública:' + colors.reset)
    console.error(error)
    return { success: false }
  }
}

/**
 * Teste de Performance
 */
async function testPerformance() {
  console.log('⚡ Testando performance...')

  const start = Date.now()

  try {
    // Testar múltiplas requisições em paralelo
    const requests = [
      fetch('http://localhost:3000/api/themes'),
      fetch('http://localhost:3000/api/analytics'),
      fetch('http://localhost:3000/api/links'),
      fetch('http://localhost:3000/testeadmin'),
    ]

    await Promise.all(requests)

    const end = Date.now()
    const duration = end - start

    console.log(colors.green + `✅ Performance: OK` + colors.reset)
    console.log(`   ${requests.length} requisições em ${duration}ms`)
    console.log(`   Média: ${(duration / requests.length).toFixed(0)}ms por requisição`)

    return { success: true, duration }
  } catch (error) {
    console.error(colors.red + '❌ Erro ao testar performance:' + colors.reset)
    console.error(error)
    return { success: false }
  }
}

/**
 * Relatório Final
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(60))
  console.log(' 🧪 SUITE DE TESTES - LINKBIO BRASIL ')
  console.log(' '.repeat(60))

  const results = {}

  console.log('\n📊 Etapa 1: Conexão com Banco')
  const dbResult = await testDatabaseConnection()
  results.database = dbResult.success
  console.log('')

  console.log('\n📊 Etapa 2: Migrations')
  const migrationsResult = await testMigrations()
  results.migrations = migrationsResult.success
  console.log('')

  console.log('\n📊 Etapa 3: Temas')
  const themesResult = await testThemes()
  results.themes = themesResult.success
  console.log('')

  console.log('\n📊 Etapa 4: Endpoints da API')
  const apiResult = await testAPIEndpoints()
  results.api = apiResult.success
  console.log('')

  console.log('\n📊 Etapa 5: Página Pública')
  const pageResult = await testPublicPage()
  results.publicPage = pageResult.success
  console.log('')

  console.log('\n📊 Etapa 6: Performance')
  const perfResult = await testPerformance()
  results.performance = perfResult.success
  console.log('')

  console.log('\n' + '='.repeat(60))
  console.log(colors.blue + '\n📊 RESUMO FINAL' + colors.reset)
  console.log(colors.blue + ' '.repeat(60) + colors.reset)

  const totalTests = 6
  const passedTests = Object.values(results).filter(r => r).length
  const successRate = ((passedTests / totalTests) * 100).toFixed(1)

  console.log(`   Total de Testes: ${totalTests}`)
  console.log(`   Testes Passados: ${passedTests}`)
  console.log(`   Taxa de Sucesso: ${successRate}%`)

  Object.entries(results).forEach(([name, result]) => {
    const icon = result ? '✅' : '❌'
    const color = result ? 'green' : 'red'
    console.log(`   [${icon}] ${colors[color]}${name}: ${result ? 'PASSOU' : 'FALHOU'}${colors.reset}`)
  })

  console.log('\n' + '='.repeat(60))

  if (passedTests === totalTests) {
    console.log(colors.green + '\n🎉 TODOS OS TESTES PASSARAM!' + colors.reset)
    console.log(colors.green + '\n🚀 O sistema está pronto para uso em produção!' + colors.reset)
  } else {
    console.log(colors.yellow + '\n⚠️  Alguns testes falharam.' + colors.reset)
    console.log(colors.yellow + '\n📋 Verifique o console acima para detalhes.' + colors.reset)
  }

  await prisma.$disconnect()

  process.exit(passedTests === totalTests ? 0 : 1)
}

// Executar todos os testes
if (process.argv.includes('--api-only')) {
  testAPIEndpoints()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
} else if (process.argv.includes('--db-only')) {
  testDatabaseConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
} else if (process.argv.includes('--themes-only')) {
  testThemes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
} else {
  runAllTests()
}
