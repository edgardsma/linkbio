/**
 * Teste das Novas Funcionalidades - LinkBio Brasil
 * Testa reordenação, upload de avatar/background e novos endpoints
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

// Token de sessão global para autenticação
let sessionToken = null

/**
 * Função auxiliar para obter token JWT
 */
async function getAuthToken() {
  console.log('🔐 Obtendo token JWT...')

  try {
    const response = await fetch('http://localhost:3000/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste@linkbio.com',
        password: 'teste123',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(colors.red + '❌ Falha ao obter token:' + colors.reset)
      console.error(`   ${error.error || response.statusText}`)
      return null
    }

    const data = await response.json()
    sessionToken = data.token

    console.log(colors.green + '✅ Token obtido com sucesso!' + colors.reset)
    console.log(`   Token: ${sessionToken.substring(0, 20)}...`)

    return sessionToken
  } catch (error) {
    console.error(colors.red + '❌ Erro ao obter token:' + colors.reset)
    console.error(error)
    return null
  }
}

/**
 * Teste 1: Endpoint de Reordenação de Links
 */
async function testReorderEndpoint() {
  console.log('\n' + colors.blue + '🔄 Teste 1: Reordenação de Links' + colors.reset)

  try {
    // Criar links de teste
    const link1 = await prisma.link.create({
      data: {
        userId: (await prisma.user.findFirst({ where: { email: 'teste@linkbio.com' } })).id,
        title: 'Link 1',
        url: 'https://example.com/1',
        position: 0,
      },
    })

    const link2 = await prisma.link.create({
      data: {
        userId: (await prisma.user.findFirst({ where: { email: 'teste@linkbio.com' } })).id,
        title: 'Link 2',
        url: 'https://example.com/2',
        position: 1,
      },
    })

    const link3 = await prisma.link.create({
      data: {
        userId: (await prisma.user.findFirst({ where: { email: 'teste@linkbio.com' } })).id,
        title: 'Link 3',
        url: 'https://example.com/3',
        position: 2,
      },
    })

    console.log(`   Links criados: ${link1.id.substring(0, 8)}..., ${link2.id.substring(0, 8)}..., ${link3.id.substring(0, 8)}...`)

    // Testar reordenação
    const response = await fetch('http://localhost:3000/api/links/reorder', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        links: [
          { id: link3.id, position: 0 },
          { id: link1.id, position: 1 },
          { id: link2.id, position: 2 },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.log(colors.red + `   ❌ Status: ${response.status}` + colors.reset)
      console.log(`   Error: ${error.error}`)
      return { success: false, error }
    }

    const data = await response.json()
    console.log(colors.green + `   ✅ Status: ${response.status}` + colors.reset)
    console.log(`   ${data.message}`)

    // Verificar se as posições foram atualizadas
    const updatedLinks = await prisma.link.findMany({
      where: { id: { in: [link1.id, link2.id, link3.id] } },
      orderBy: { position: 'asc' },
    })

    const positionsUpdated =
      updatedLinks[0].id === link3.id &&
      updatedLinks[1].id === link1.id &&
      updatedLinks[2].id === link2.id

    if (positionsUpdated) {
      console.log(colors.green + '   ✅ Posições atualizadas corretamente' + colors.reset)
    } else {
      console.log(colors.red + '   ❌ Posições não foram atualizadas' + colors.reset)
    }

    // Limpar links de teste
    await prisma.link.deleteMany({ where: { id: { in: [link1.id, link2.id, link3.id] } } })

    return { success: true, positionsUpdated }
  } catch (error) {
    console.error(colors.red + '   ❌ Erro:' + colors.reset)
    console.error(error)
    return { success: false, error }
  }
}

/**
 * Teste 2: Upload de Avatar
 */
async function testAvatarUpload() {
  console.log('\n' + colors.blue + '📷 Teste 2: Upload de Avatar' + colors.reset)

  try {
    // Criar um arquivo de imagem simulado
    const imageBuffer = Buffer.from(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQUA2Dg8AAAABJRU5ErkJggg==',
      'base64'
    ).slice(22)

    const formData = new FormData()
    formData.append('avatar', new Blob([imageBuffer], { type: 'image/png' }), 'test-avatar.png')

    const response = await fetch('http://localhost:3000/api/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      console.log(colors.red + `   ❌ Status: ${response.status}` + colors.reset)
      console.log(`   Error: ${error.error}`)
      return { success: false, error }
    }

    const data = await response.json()
    console.log(colors.green + `   ✅ Status: ${response.status}` + colors.reset)
    console.log(`   ${data.message}`)
    console.log(`   URL: ${data.url}`)

    return { success: true, data }
  } catch (error) {
    console.error(colors.red + '   ❌ Erro:' + colors.reset)
    console.error(error)
    return { success: false, error }
  }
}

/**
 * Teste 3: Upload de Background
 */
async function testBackgroundUpload() {
  console.log('\n' + colors.blue + '🖼️  Teste 3: Upload de Background' + colors.reset)

  try {
    // Criar um arquivo de imagem simulado
    const imageBuffer = Buffer.from(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQUA2Dg8AAAABJRU5ErkJggg==',
      'base64'
    ).slice(22)

    const formData = new FormData()
    formData.append('background', new Blob([imageBuffer], { type: 'image/png' }), 'test-bg.png')

    const response = await fetch('http://localhost:3000/api/background', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      console.log(colors.red + `   ❌ Status: ${response.status}` + colors.reset)
      console.log(`   Error: ${error.error}`)
      return { success: false, error }
    }

    const data = await response.json()
    console.log(colors.green + `   ✅ Status: ${response.status}` + colors.reset)
    console.log(`   ${data.message}`)
    console.log(`   URL: ${data.url}`)

    return { success: true, data }
  } catch (error) {
    console.error(colors.red + '   ❌ Erro:' + colors.reset)
    console.error(error)
    return { success: false, error }
  }
}

/**
 * Teste 4: Validação de Dados
 */
async function testDataValidation() {
  console.log('\n' + colors.blue + '✅ Teste 4: Validação de Dados' + colors.reset)

  const tests = [
    {
      name: 'Email inválido',
      endpoint: '/api/auth/token',
      payload: { email: 'invalid', password: 'teste123' },
      expectError: true,
    },
    {
      name: 'Senha muito curta',
      endpoint: '/api/auth/token',
      payload: { email: 'teste@linkbio.com', password: '123' },
      expectError: true,
    },
    {
      name: 'URL inválida',
      endpoint: '/api/links',
      payload: { title: 'Teste', url: 'invalid-url' },
      expectError: true,
    },
    {
      name: 'Título muito longo',
      endpoint: '/api/links',
      payload: { title: 'A'.repeat(101), url: 'https://example.com' },
      expectError: true,
    },
  ]

  const results = []

  for (const test of tests) {
    try {
      console.log(`   📡 ${test.name}`)

      const response = await fetch(`http://localhost:3000${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(test.endpoint !== '/api/auth/token' && { 'Authorization': `Bearer ${sessionToken}` }),
        },
        body: JSON.stringify(test.payload),
      })

      const data = await response.json()

      if (test.expectError) {
        if (response.status >= 400) {
          console.log(colors.green + `      ✅ Validação funcionou` + colors.reset)
          console.log(`      Erro: ${data.error || data.details?.[Object.keys(data.details)[0]]}`)
          results.push({ test: test.name, success: true })
        } else {
          console.log(colors.red + `      ❌ Validação não funcionou` + colors.reset)
          results.push({ test: test.name, success: false })
        }
      }
    } catch (error) {
      console.error(colors.red + `      ❌ Erro no teste: ${error.message}` + colors.reset)
      results.push({ test: test.name, success: false })
    }
  }

  const successCount = results.filter(r => r.success).length

  console.log(colors.blue + `\n   📊 Resumo da Validação:` + colors.reset)
  console.log(`   Sucesso: ${successCount}/${tests.length}`)

  return { success: successCount === tests.length, results }
}

/**
 * Teste 5: Rate Limiting
 */
async function testRateLimiting() {
  console.log('\n' + colors.blue + '⚡ Teste 5: Rate Limiting' + colors.reset)

  console.log('   🔐 Obtendo token para testar rate limiting...')

  try {
    // Fazer várias tentativas de login
    const attempts = 6
    const rateLimitHeaders = []

    for (let i = 0; i < attempts; i++) {
      console.log(`   📡 Tentativa ${i + 1}/${attempts}`)

      const response = await fetch('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'rate@limit.com',
          password: 'senha123',
        }),
      })

      rateLimitHeaders.push({
        attempt: i + 1,
        status: response.status,
        remaining: response.headers.get('X-RateLimit-Remaining'),
        reset: response.headers.get('X-RateLimit-Reset'),
      })
    }

    // Verificar se o rate limiting foi acionado
    const limitedAttempts = rateLimitHeaders.filter(
      h => h.status === 429
    )

    if (limitedAttempts.length > 0) {
      console.log(colors.green + `   ✅ Rate limiting acionado após ${limitedAttempts[0].attempt} tentativas` + colors.reset)
      console.log(`   Requisições restantes: ${rateLimitHeaders[limitedAttempts[0].attempt - 1].remaining}`)
    } else {
      console.log(colors.yellow + `   ⚠️  Rate limiting não acionado (${attempts} tentativas)` + colors.reset)
      console.log(`   Isso pode ser normal se as requisições foram feitas rapidamente`)
    }

    // Mostrar headers de rate limiting
    console.log(colors.blue + `\n   📊 Headers de Rate Limiting:` + colors.reset)
    rateLimitHeaders.slice(-3).forEach(h => {
      console.log(`   Tentativa ${h.attempt}: Status ${h.status}, Restantes: ${h.remaining}`)
    })

    return { success: limitedAttempts.length > 0, rateLimitHeaders }
  } catch (error) {
    console.error(colors.red + '   ❌ Erro:' + colors.reset)
    console.error(error)
    return { success: false, error }
  }
}

/**
 * Teste 6: Headers de Segurança
 */
async function testSecurityHeaders() {
  console.log('\n' + colors.blue + '🔒 Teste 6: Headers de Segurança' + colors.reset)

  try {
    const response = await fetch('http://localhost:3000/api/themes')

    const securityHeaders = [
      'X-DNS-Prefetch-Control',
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'X-XSS-Protection',
    ]

    console.log('   📋 Headers encontrados:')

    const foundHeaders = []

    for (const header of securityHeaders) {
      const value = response.headers.get(header)
      if (value) {
        console.log(colors.green + `      ✅ ${header}` + colors.reset)
        foundHeaders.push(header)
      } else {
        console.log(colors.red + `      ❌ ${header} (não encontrado)` + colors.reset)
      }
    }

    // Headers de rate limiting
    const rateHeaders = ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
    for (const header of rateHeaders) {
      if (response.headers.get(header)) {
        console.log(colors.green + `      ✅ ${header}` + colors.reset)
        foundHeaders.push(header)
      }
    }

    const success = foundHeaders.length >= 5 // Ao menos 5 headers de segurança

    console.log(colors.blue + `\n   📊 Resumo: ${foundHeaders.length}/${securityHeaders.length} headers encontrados` + colors.reset)

    return { success, foundHeaders }
  } catch (error) {
    console.error(colors.red + '   ❌ Erro:' + colors.reset)
    console.error(error)
    return { success: false, error }
  }
}

/**
 * Função Principal de Execução
 */
async function runAllTests() {
  console.log(colors.cyan + '='.repeat(50) + colors.reset)
  console.log(colors.cyan + '  LinkBio Brasil - Teste Novas Funcionalidades' + colors.reset)
  console.log(colors.cyan + '='.repeat(50) + colors.reset)

  const startTime = Date.now()
  const results = []

  // Obter token de autenticação
  sessionToken = await getAuthToken()

  if (!sessionToken) {
    console.log(colors.red + '\n❌ Não foi possível obter token. Testes encerrados.' + colors.reset)
    return
  }

  // Executar todos os testes
  results.push(await testReorderEndpoint())
  results.push(await testAvatarUpload())
  results.push(await testBackgroundUpload())
  results.push(await testDataValidation())
  results.push(await testRateLimiting())
  results.push(await testSecurityHeaders())

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
