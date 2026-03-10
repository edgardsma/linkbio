# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinkBio Brasil is a Brazilian link-in-bio platform (similar to Linktree) built with Next.js 16 App Router, Prisma ORM with PostgreSQL, and NextAuth.js for authentication. The project uses Portuguese as the primary language for all user-facing content.

## Recent Architecture Updates (March 2026)

The project has been enhanced with a modern architecture following LinkHub patterns:

### Implemented Features:
- ✅ **TypeScript** - Configured with `allowJs: true` for gradual migration
- ✅ **Testes** - Jest + React Testing Library configured
- ✅ **CI/CD** - GitHub Actions workflows for automated testing and Vercel deploy
- ✅ **Observabilidade** - Structured logging, request tracking, performance monitoring, health checks
- ✅ **Redis Cache** - Client configured with rate limiting and cache helpers
- ✅ **RBAC** - Role-based access control (USER, ADMIN, AGENCY roles)

### New Libraries:
- `lib/logger.ts` - Structured logging with context
- `lib/middleware.ts` - Request ID tracking
- `lib/redis.ts` - Redis client and cache utilities
- `lib/auth.ts` - RBAC and authorization helpers
- `lib/performance.ts` - Performance tracking
- `lib/health.ts` - Health check system

## Common Commands

### Development
```bash
npm run dev              # Start development server (runs on port 3000)
npm run build           # Create production build
npm start               # Start production server
npm run lint            # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
```

### Database (Prisma)
```bash
npx prisma dev          # Start PostgreSQL local (runs on port 51213)
npx prisma generate     # Generate Prisma client
npx prisma migrate dev   # Create and run migrations
npx prisma studio       # Open Prisma Studio GUI
npx prisma db push      # Push schema changes without migration
```

### Testing (Jest)
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
npm run test:ci             # Run tests for CI
npm run test:unit           # Run unit tests only
npm run test:integration      # Run integration tests only
```

### Docker Development
```bash
# Start all services (PostgreSQL, Redis, Next.js app)
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 18, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Prisma Dev or Docker)
- **Authentication**: NextAuth.js 4 (supports Google, GitHub, Email/Password with bcrypt)
- **Monitoring**: Structured logging, performance tracking, health checks
- **Cache**: Redis with @upstash/redis
- **Testing**: Jest 30.2 + React Testing Library

### Project Structure

```
app/                          # Next.js App Router
├── api/                      # API Routes (JavaScript/TypeScript mixed)
│   ├── auth/[...nextauth]/   # NextAuth configuration
│   ├── links/                # Link CRUD operations
│   ├── profile/              # Profile operations
│   ├── stripe/               # Stripe payment integration
│   └── health/               # Health check (uses new observability)
├── auth/                     # Auth pages (login, signup)
├── dashboard/                # User dashboard (client component)
├── profile/                  # Profile editing page
├── [username]/               # Public linkbio pages (dynamic route)
├── linktree/                 # Alternative linktree-style pages
├── links/[username]/         # Another link style variant
└── layout.js                # Root layout with SessionProvider

components/                   # React components (mostly client components)
├── SessionProvider.js        # NextAuth session wrapper (required in layout)
├── AnalyticsCharts.jsx       # Click statistics visualization
├── EditLinkModal.jsx        # Link editing modal
├── LinkTypeSelector.jsx      # Link type dropdown (URL, WhatsApp, Email, Phone)
├── DraggableLinkList.jsx    # Drag & drop link reordering (dnd-kit)
├── ThemeSelector.jsx        # Theme selection component
└── QRCodeWidget.jsx         # QR code generation

lib/                         # Server-side utilities
├── prisma.js               # Prisma client singleton (exports both named and default)
├── logger.ts                # Structured logging system (NEW)
├── middleware.ts             # Request ID middleware (NEW)
├── redis.ts                 # Redis client and cache (NEW)
├── auth.ts                  # RBAC and authorization (NEW)
├── performance.ts            # Performance tracking (NEW)
└── health.ts                 # Health check system (NEW)

prisma/
└── schema.prisma            # Database schema (User has role field)

.github/workflows/
├── ci.yml                    # CI pipeline (tests, lint, build, deploy) (NEW)
└── deploy.yml                 # Deploy pipeline to Vercel (NEW)

__tests__/                     # Test suite
├── unit/                    # Unit tests
├── integration/             # Integration tests
└── e2e/                       # E2E tests

docs/                         # Documentation
├── ARQUITETURA-LINKHUB-IMPLEMENTACAO.md
├── RESUMO-IMPLEMENTACAO.md
└── EXEMPLOS-ARQUITETURA-LINKHUB.md
```

### Key Architectural Patterns

**Authentication Flow**: NextAuth.js handles all authentication. The `SessionProvider` wrapper in `app/layout.js` makes the session available throughout the app via the `useSession` hook from `next-auth/react`.

**API Routes**: All API routes are in `app/api/`. When creating new endpoints:
- Use `getServerSession(authOptions)` from next-auth for server-side auth
- Import prisma with `import prisma from '@/lib/prisma'` (default export)
- Use Zod for validation (see `lib/validation.js`)
- NEW: Use structured logging: `import { logger, apiLogger } from '@/lib/logger'`
- NEW: Use request ID tracking: `import { getRequestId } from '@/lib/middleware'`

**Stripe Integration**: Stripe is conditionally initialized to prevent build errors when keys aren't configured:
```javascript
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' })
  : null

// Always check before using:
if (!stripe) {
  return Response.json({ error: 'Stripe não está configurado' }, { status: 503 })
}
```

**Prisma Client**: The Prisma client is exported as both named and default export in `lib/prisma.js` to support both import styles:
```javascript
export { prisma }
export default prisma
```

**NEW: Structured Logging**:
```typescript
import { logger } from '@/lib/logger'

logger.info('Message', { userId: '123', metadata: { key: 'value' }})
logger.error('Error', error, { context: { userId: '123' }})
logger.performance('Operation', 250, { url: '/api/links' })
```

**NEW: Cache with Redis**:
```typescript
import { getUserProfile } from '@/lib/redis'

// Cache automático de perfil (5 minutos)
const profile = await getUserProfile('username')

// Invalidar cache manualmente
import { invalidateProfile } from '@/lib/redis'
await invalidateProfile('username')
```

**NEW: RBAC**:
```typescript
import { authorize, requireAuth, canAccess } from '@/lib/auth'

// Middleware para proteger rotas
export const POST = authorize([UserRole.ADMIN])(async (request) => {
  // ... código protegido
})

// Verificar permissão manualmente
const user = await requireAuth(request)
if (!canAccess(user, '/api/admin')) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
}
```

**NEW: Rate Limiting**:
```typescript
import { checkRateLimit } from '@/lib/redis'

const { allowed, remaining } = await checkRateLimit(ip)

if (!allowed) {
  return NextResponse.json(
    { error: 'Muitas requisições' },
    { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
  )
}
```

**NEW: Performance Tracking**:
```typescript
import { trackPerformance } from '@/lib/performance'

export async function POST(request: Request) {
  return trackPerformance('POST /api/links', async () => {
    // ... código da API
  })
}
```

## Database Schema (Key Models)

**User**: Stores user credentials, profile info, theme customization (colors, background), and has one-to-many relationships with Links. Has `role` field for RBAC.

**Link**: Represents a link on a user's page with title, URL, description, icon, type (url/whatsapp/email/phone), position, click count, and status.

**Click**: Logs each link click with timestamp, user agent, referrer, country, city.

**Subscription**: Manages Stripe subscription data (status, plan, customer ID, price ID, period end).

**Theme**: Predefined themes for user pages with color schemes.

## Environment Variables

Required variables are in `.env.example`. Critical ones:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Must be set for auth to work
- `NEXTAUTH_URL` - Typically `http://localhost:3000` in development
- Stripe variables are optional (integration fails gracefully when missing)
- NEW: `REDIS_URL` and `REDIS_TOKEN` for Redis cache

## Important Notes

- All user-facing text is in Portuguese (pt-BR)
- `useSearchParams()` must be wrapped in `Suspense` for client components
- Client components need `'use client'` directive at the top
- Server components don't need the directive
- The project uses Tailwind CSS 4 (`@import "tailwindcss"` in `app/globals.css`)
- PostgreSQL runs on port 51213 when using Prisma Dev, or 5432 with Docker
- Links can be reordered via drag-and-drop using dnd-kit library
- **NEW**: The project now supports structured logging, caching, RBAC, rate limiting, and performance tracking
- **NEW**: Tests are implemented across unit, integration, and E2E levels using Jest and Playwright
- **NEW**: CI/CD is configured but needs GitHub secrets to be set up

## Quick Start

1. **Install dependencies**: `npm install`
2. **Start database**: `docker-compose -f docker-compose.dev.yml up -d`
3. **Run migrations**: `npm run prisma:generate`
4. **Start dev server**: `npm run dev`
5. **Access health check**: `curl http://localhost:3000/api/health`
6. **Run tests**: `npm test`

## Test User (Admin)
```
Email: admin@linkbio.com
Password: 12345678
Username: admin
Role: ADMIN
```
