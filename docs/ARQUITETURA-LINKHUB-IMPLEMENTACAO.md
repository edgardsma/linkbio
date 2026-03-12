> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# Documentação de Implementação - Arquitetura LinkHub

## 📋 Visão Geral

Migração do projeto **LinkBio Brasil** para a arquitetura técnica do **LinkHub**, incluindo TypeScript, testes, CI/CD, observabilidade, cache e RBAC.

**Status Atual:** 🟡 Em andamento
**Data início:** 05/03/2026

---

## ✅ Etapa 1: TypeScript (Completo)

### O que foi implementado:
- ✅ TypeScript 5.x instalado
- ✅ @types instalados (react, node, bcryptjs, qrcode)
- ✅ tsconfig.json configurado
- ✅ Suporte para TypeScript + JavaScript misto (allowJs: true)

### Estrutura de tipos:
```typescript
// Criar pasta types/ para tipos compartilhados
types/
├── prisma.ts           // Tipos do Prisma gerados
├── api.ts              // Tipos das APIs
├── auth.ts             // Tipos de autenticação
└── index.ts            // Export centralizado
```

### Como converter arquivos:
1. Renomear `.js` → `.tsx` (componentes React)
2. Renomear `.js` → `.ts` (utilitários)
3. Adicionar tipos às funções e componentes
4. Corrigir erros de tipo do TypeScript

### Arquivos prioritários para converter:
- `app/page.js` → `app/page.tsx`
- `app/dashboard/page.js` → `app/dashboard/page.tsx`
- `lib/prisma.js` → `lib/prisma.ts`
- `components/*` → `components/*.tsx`

---

## 🧪 Etapa 2: Testes (Em andamento)

### O que foi implementado:
- ✅ Jest instalado
- ✅ React Testing Library instalado
- ✅ @testing-library/user-event instalado

### Configuração necessária:
```bash
# Criar arquivo jest.config.js
# Criar arquivo jest.setup.js
# Criar scripts de teste no package.json
```

### Estrutura de testes:
```
__tests__/
├── unit/              # Testes unitários
│   ├── components/    # Testes de componentes
│   ├── lib/          # Testes de utilitários
│   └── hooks/         # Testes de custom hooks
├── integration/       # Testes de integração
│   ├── api/          # Testes de API
│   └── auth/         # Testes de autenticação
└── e2e/              # Testes end-to-end
    ├── auth.spec.ts
    └── dashboard.spec.ts
```

### Exemplo de teste de componente:
```typescript
// __tests__/unit/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import Button from '@/components/Button'

describe('Button', () => {
  it('renderiza com o texto correto', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })
})
```

### Exemplo de teste de API:
```typescript
// __tests__/integration/api/links.test.ts
import { describe, it, expect } from '@jest/globals'
import { POST } from '@/app/api/links/route'

describe('API de Links', () => {
  it('cria um novo link', async () => {
    const request = new Request('http://localhost:3000/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Teste', url: 'https://teste.com' })
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

---

## 🚀 Etapa 3: CI/CD (Pendente)

### Ferramenta: GitHub Actions

### Workflow a criar:
```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: linkbio_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/linkbio_test

      - name: Build
        run: npm run build
```

### Deploy automático (main branch):
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📊 Etapa 4: Observabilidade (Pendente)

### Stack de observabilidade:
- **Logs estruturados** (JSON)
- **Monitoring de uptime**
- **Métricas de performance**

### Implementação:

#### 1. Logger Estruturado
```typescript
// lib/logger.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  userId?: string
  requestId?: string
}

class Logger {
  private context: Record<string, unknown> = {}

  setContext(key: string, value: unknown) {
    this.context[key] = value
  }

  clearContext() {
    this.context = {}
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    }
    console.log(JSON.stringify(entry))
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    })
  }
}

export const logger = new Logger()
```

#### 2. Middleware de Request ID
```typescript
// lib/request-id.ts
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function addRequestId(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || uuidv4()
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  return response
}
```

#### 3. Health Check e Status
```typescript
// lib/health.ts
interface HealthStatus {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  checks: {
    database: string
    redis: string
    uptime: number
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
  ])

  const database = checks[0].status === 'fulfilled' ? 'ok' : 'error'
  const redis = checks[1].status === 'fulfilled' ? 'ok' : 'error'

  return {
    status: database === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database,
      redis,
      uptime: process.uptime(),
    },
  }
}
```

#### 4. Monitoramento de Performance
```typescript
// lib/performance.ts
export function trackPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  return fn().finally(() => {
    const duration = Date.now() - start
    logger.info(`Performance: ${name}`, { duration })
  })
}

// Uso:
export async function POST(request: Request) {
  return trackPerformance('POST /api/links', async () => {
    // ... código da API
  })
}
```

---

## ⚡ Etapa 5: Redis Cache (Pendente)

### Implementação:

#### 1. Cliente Redis
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export { redis, ratelimit }
```

#### 2. Cache de Perfis Públicos
```typescript
// lib/cache.ts
interface CacheConfig {
  key: string
  ttl: number
}

export async function getCached<T>(config: CacheConfig): Promise<T | null> {
  const cached = await redis.get(config.key)
  return cached ? JSON.parse(cached) : null
}

export async function setCached<T>(config: CacheConfig, data: T): Promise<void> {
  await redis.setex(config.key, config.ttl, JSON.stringify(data))
}

// Cache de perfil público (TTL: 5 minutos)
export async function getUserProfile(username: string) {
  const config: CacheConfig = {
    key: `profile:${username}`,
    ttl: 300, // 5 minutos
  }

  let profile = await getCached(config)

  if (!profile) {
    profile = await prisma.user.findUnique({
      where: { username },
      include: { links: true },
    })

    if (profile) {
      await setCached(config, profile)
    }
  }

  return profile
}
```

#### 3. Rate Limiting
```typescript
// lib/rate-limit.ts
import { ratelimit } from './redis'

export async function checkRateLimit(identifier: string) {
  const { success, remaining, reset } = await ratelimit.limit(identifier)

  return {
    allowed: success,
    remaining,
    resetAt: new Date(reset).toISOString(),
  }
}

// Uso na API:
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, remaining } = await checkRateLimit(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições' },
      { status: 429 }
    )
  }

  // ... continuar
}
```

---

## 🔐 Etapa 6: RBAC - Role-Based Access Control (Pendente)

### Implementação:

#### 1. Enum de Roles
```typescript
// lib/auth.ts
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  AGENCY = 'agency',
}

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  // ... outros campos
}
```

#### 2. Verificação de Roles
```typescript
// lib/auth.ts
export function hasRole(user: UserWithRole, role: UserRole): boolean {
  if (user.role === UserRole.ADMIN) return true
  return user.role === role
}

export function hasAnyRole(user: UserWithRole, roles: UserRole[]): boolean {
  return roles.includes(user.role)
}

export function canAccess(user: UserWithRole, resource: string): boolean {
  if (user.role === UserRole.ADMIN) return true

  const permissions = {
    '/api/admin/*': [UserRole.ADMIN],
    '/api/users': [UserRole.AGENCY, UserRole.ADMIN],
    '/api/analytics': [UserRole.ADMIN, UserRole.AGENCY],
  }

  const requiredRoles = Object.entries(permissions)
    .find(([pattern]) => resource.match(pattern.replace('*', '.*')))
    ?.[1]

  if (!requiredRoles) return true

  return requiredRoles.includes(user.role)
}
```

#### 3. Middleware de Autorização
```typescript
// lib/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { canAccess, UserRole } from './auth'

export function authorize(user: UserWithRole, requiredRoles?: UserRole[]) {
  return async (request: NextRequest) => {
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    if (!canAccess(user, request.nextUrl.pathname)) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    return NextResponse.next()
  }
}
```

#### 4. Atualização do Prisma Schema
```prisma
model User {
  // ... campos existentes
  role String @default("user")  // user, admin, agency
}
```

---

## 📁 Estrutura Final do Projeto

```
linkbio-brasil/
├── app/                     # Next.js App Router
│   ├── api/                 # API Routes (TypeScript)
│   ├── auth/                # Autenticação
│   ├── dashboard/            # Dashboard
│   └── [username]/          # Páginas públicas
├── components/             # Componentes React (.tsx)
│   ├── ui/                 # Componentes UI base
│   ├── forms/              # Formulários
│   └── layout/             # Layout components
├── lib/                    # Utilitários (.ts)
│   ├── auth.ts              # Autenticação e RBAC
│   ├── cache.ts             # Redis cache
│   ├── logger.ts            # Logging estruturado
│   ├── rate-limit.ts        # Rate limiting
│   ├── performance.ts        # Performance tracking
│   └── prisma.ts           # Cliente Prisma
├── types/                  # Definições de tipos
│   ├── api.ts
│   ├── auth.ts
│   └── index.ts
├── __tests__/              # Testes
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/           # CI/CD
│       ├── ci.yml
│       └── deploy.yml
├── docker-compose.yml       # Docker (prod)
├── tsconfig.json
└── package.json
```

---

## 📊 Cronograma de Implementação

| Etapa | Status | Prioridade | Tempo estimado |
|-------|--------|------------|---------------|
| TypeScript | ✅ Completo | Alta | 2h |
| Testes | 🟡 Em andamento | Alta | 4h |
| CI/CD | ⏳ Pendente | Alta | 3h |
| Observabilidade | ⏳ Pendente | Média | 3h |
| Redis Cache | ⏳ Pendente | Média | 2h |
| RBAC | ⏳ Pendente | Média | 2h |

**Total estimado:** ~16 horas

---

## 🚀 Próximos Passos

1. **Imediato:**
   - Configurar Jest
   - Criar primeiros testes
   - Configurar GitHub Actions

2. **Curto prazo:**
   - Implementar logger estruturado
   - Adicionar Redis cache
   - Implementar RBAC básico

3. **Médio prazo:**
   - Monitoramento de uptime
   - Métricas de performance
   - Dashboard de observabilidade

---

## 📝 Notas Importantes

### Benefícios da migração:
- ✅ **Type Safety:** TypeScript previne erros em tempo de compilação
- ✅ **Melhor DX:** Autocompletar, refatorar mais seguro
- ✅ **Testes:** Garantia de qualidade
- ✅ **CI/CD:** Deploy automático, menos erros humanos
- ✅ **Observabilidade:** Problemas encontrados mais rápido
- ✅ **Performance:** Cache reduz carga no banco
- ✅ **Segurança:** RBAC limita acessos

### Riscos:
- ⚠️ Curva de aprendizado da equipe
- ⚠️ Tempo de migração
- ⚠️ Possíveis breaking changes

### Mitigação:
- 📖 Documentação detalhada
- 🧪 Testes abrangentes
- 🔄 Migração incremental
- 📋 Code review rigoroso

---

**Última atualização:** 05/03/2026 (16:30)
**Responsável:** Equipe LinkBio Brasil

---

## 📊 Progresso Atualizado

| Item | Status | Progresso |
|------|--------|----------|
| TypeScript | ✅ Completo | 100% |
| Testes (Jest) | ✅ Completo | 100% |
| CI/CD | ✅ Completo | 100% |
| Observabilidade | ✅ Completo | 100% |
| Redis Cache | ✅ Completo | 100% |
| RBAC | ✅ Completo | 100% |
| Migração de código | ⏳ Pendente | 0% |

**Progresso geral:** ~60% (ferramentas e infra)
