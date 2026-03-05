# Exemplos de Uso - Arquitetura LinkHub

## 📝 Como usar o Logger

```typescript
import { logger, authLogger, apiLogger, dbLogger } from '@/lib/logger'

// Log básico
logger.info('Usuário criado', { userId: '123' })

// Log com erro
logger.error('Erro ao criar usuário', error, { email: 'test@test.com' })

// Log de performance
logger.performance('POST /api/links', 250, { url: '/api/links' })

// Loggers específicos
authLogger.info('Login bem-sucedido', { email: 'test@test.com' })
apiLogger.warn('Rate limit quase atingido', { ip: '192.168.1.1' })
dbLogger.error('Erro de banco', error, { query: 'SELECT * FROM users' })
```

---

## 🔄 Como usar o Request ID

```typescript
import { getRequestId, withRequestId } from '@/lib/middleware'

// Em qualquer API route
export async function POST(request: Request) {
  const requestId = getRequestId()

  logger.info('API chamada', { requestId, url: request.url })

  const response = NextResponse.json({ success: true })

  return withRequestId(response)
}
```

---

## 🚀 Como usar o Cache

```typescript
import { getUserProfile, invalidateProfile } from '@/lib/redis'

// Cache automático de perfil
const profile = await getUserProfile('usuario123')

// Invalidar cache manualmente
await invalidateProfile('usuario123')

// Custom cache
import { getCached, setCached } from '@/lib/redis'

const data = await getCached({
  key: 'config:site',
  ttl: 3600, // 1 hora
})

await setCached({
  key: 'config:site',
  ttl: 3600,
  data: { title: 'LinkBio Brasil' }
})
```

---

## 🚦 Como usar Rate Limiting

```typescript
import { checkRateLimit } from '@/lib/redis'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  const { allowed, remaining, resetAt } = await checkRateLimit(ip, 20)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições', resetAt },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  // Continuar com a lógica normal...
}
```

---

## 🔐 Como usar RBAC

### Exemplo 1: Middleware de autorização
```typescript
import { authorize } from '@/lib/auth'

// Apenas admin pode acessar
export const POST = authorize([UserRole.ADMIN])(async (request) => {
  return NextResponse.json({ message: 'Área admin' })
})

// Apenas admin e agency podem acessar
export const GET = authorize([UserRole.ADMIN, UserRole.AGENCY])(async (request) => {
  return NextResponse.json({ message: 'Área restrita' })
})

// Usuários autenticados podem acessar
export const PUT = authorize()(async (request) => {
  return NextResponse.json({ message: 'Área do usuário' })
})
```

### Exemplo 2: Verificação manual
```typescript
import { requireAuth, hasRole, canAccess, canEditOtherUser } from '@/lib/auth'

export async function DELETE(request: Request, { params }) {
  const currentUser = await requireAuth(request)
  const { id } = params

  // Verificar se é admin
  if (!hasRole(currentUser, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  // Verificar se pode editar
  if (!canEditOtherUser(currentUser, id)) {
    return NextResponse.json({ error: 'Você só pode editar seu próprio perfil' }, { status: 403 })
  }

  // Deletar...
}
```

### Exemplo 3: Verificação de permissão
```typescript
import { canPerformAction } from '@/lib/auth'

export async function PATCH(request: Request) {
  const currentUser = await requireAuth(request)

  // Verificar se pode fazer update
  if (!canPerformAction(currentUser, '/api/links', 'update')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  // Continuar...
}
```

### Exemplo 4: Limite por role
```typescript
import { getLimitsByRole } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await requireAuth(request)
  const limits = getLimitsByRole(user.role)

  const userLinks = await prisma.link.count({
    where: { userId: user.id }
  })

  if (userLinks >= limits.maxLinks) {
    return NextResponse.json(
      { error: `Limite de links atingido. Plano atual: ${user.role} (${limits.maxLinks} links)` },
      { status: 403 }
    )
  }

  // Continuar...
}
```

### Exemplo 5: Analytics (apenas admin e agency)
```typescript
import { canViewAnalytics, isAdmin, isAgencyOrAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await isAdmin(request)

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!canViewAnalytics(user)) {
    return NextResponse.json({ error: 'Analytics disponível apenas para planos PRO e acima' }, { status: 403 })
  }

  // Buscar analytics...
}
```

---

## ⚡ Como usar Performance Tracking

### Exemplo 1: API route com tracking
```typescript
import { trackPerformance } from '@/lib/performance'

export async function POST(request: Request) {
  return trackPerformance('POST /api/links', async () => {
    // Lógica da API
    const body = await request.json()

    // Criar link...

    return NextResponse.json({ success: true })
  })
}
```

### Exemplo 2: Operação do Prisma com tracking
```typescript
import { trackPrismaOperation } from '@/lib/performance'

export async function GET(request: Request) {
  const links = await trackPrismaOperation('link.findMany', async () => {
    return prisma.link.findMany({
      where: { userId: request.user.id }
    })
  })

  return NextResponse.json({ links })
}
```

### Exemplo 3: Operação do Redis com tracking
```typescript
import { trackRedisOperation } from '@/lib/performance'

export async function GET(request: Request) {
  const cached = await trackRedisOperation('cache.get', async () => {
    return redis.get('profile:test')
  })

  return NextResponse.json({ cached })
}
```

---

## 📊 Como usar Health Check

### Verificar health manualmente
```bash
curl http://localhost:3000/api/health
```

### Response de exemplo
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T16:30:00.000Z",
  "uptime": 1234.5,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "up",
      "duration": 45,
      "message": "Conexão com PostgreSQL está ok"
    },
    "redis": {
      "status": "up",
      "duration": 12,
      "message": "Conexão com Redis está ok"
    },
    "performance": {
      "status": "up",
      "duration": 8,
      "message": "Status: healthy, Operações lentas: 2"
    }
  }
}
```

---

## 🎯 Exemplos Completos de API Route

### API de Links com todas as features

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/redis'
import { requireAuth, canAccess, getLimitsByRole } from '@/lib/auth'
import { trackPerformance, trackPrismaOperation } from '@/lib/performance'
import { getRequestId, withRequestId } from '@/lib/middleware'
import { logger, apiLogger } from '@/lib/logger'

export async function POST(request: Request) {
  const requestId = getRequestId()

  apiLogger.info('Criar link solicitado', { requestId })

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, remaining } = await checkRateLimit(ip)

  if (!allowed) {
    apiLogger.warn('Rate limit atingido', { requestId, ip })
    return NextResponse.json(
      { error: 'Muitas requisições' },
      {
        status: 429,
        headers: { 'X-RateLimit-Remaining': String(remaining) }
      }
    )
  }

  // Autenticação e verificação de role
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const user = session.user as any

  // Verificar permissões
  if (!canAccess(user, '/api/links')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  // Verificar limites do plano
  const limits = getLimitsByRole(user.role)
  const userLinks = await prisma.link.count({
    where: { userId: user.id, isActive: true }
  })

  if (userLinks >= limits.maxLinks) {
    return NextResponse.json(
      { error: `Limite de ${limits.maxLinks} links atingido` },
      { status: 403 }
    )
  }

  // Criar link com tracking de performance
  const body = await request.json()

  const newLink = await trackPrismaOperation('link.create', async () => {
    return prisma.link.create({
      data: {
        title: body.title,
        url: body.url,
        description: body.description,
        icon: body.icon,
        type: body.type || 'url',
        userId: user.id,
        position: userLinks + 1,
      },
    })
  })

  apiLogger.info('Link criado com sucesso', {
    requestId,
    linkId: newLink.id,
    userId: user.id,
  })

  const response = NextResponse.json({ link: newLink })

  return withRequestId(response)
}

export async function GET(request: Request) {
  const requestId = getRequestId()

  apiLogger.debug('Listar links solicitado', { requestId })

  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const user = session.user as any

  const links = await trackPrismaOperation('link.findMany', async () => {
    return prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' },
    })
  })

  apiLogger.info('Links listados com sucesso', {
    requestId,
    count: links.length,
    userId: user.id,
  })

  const response = NextResponse.json({ links })

  return withRequestId(response)
}
```

---

**Última atualização:** 05/03/2026
**Veja também:** docs/ARQUITETURA-LINKHUB-IMPLEMENTACAO.md
