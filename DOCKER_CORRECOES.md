> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# 🐳 Docker - Correções Implementadas

**Data:** 03/03/2026
**Status:** ✅ COMPLETO - Docker pronto para uso

## 📋 Problemas Corrigidos

### 1. Conflito ESM/CommonJS ✅
**Problema:** Arquivos misturando `require/module.exports` (CommonJS) com `import/export` (ESM)

**Solução:**
- Adicionado `"type": "module"` ao `package.json`
- Convertidos todos os arquivos para ESM:
  - `lib/prisma.js` - Convertido para ESM
  - `scripts/test.js` - Convertido para ESM
  - `scripts/test-theme-colors.js` - Convertido para ESM
  - `scripts/test-stripe-webhook.js` - Convertido para ESM
  - `scripts/seed-themes-simple.js` - Convertido para ESM

### 2. Next.js Standandalone Output ✅
**Problema:** Dockerfile tentava usar `.next/standalone` mas não estava configurado

**Solução:**
- Adicionado `output: 'standalone'` ao `next.config.js`
- Convertido `next.config.js` de CommonJS para ESM (`module.exports` → `export default`)

### 3. Prisma Generate no Docker ✅
**Problema:** `npm ci` executava o script `postinstall` que rodava `prisma generate` antes do schema estar disponível

**Solução:**
- Modificado Dockerfile para usar `npm ci --ignore-scripts`
- Executar `npm run postinstall` manualmente após copiar o schema

### 4. Variáveis de Ambiente Docker ✅
**Problema:** Avisos de variáveis não definidas no docker-compose

**Solução:**
- Criado `.env.docker` com todas as variáveis necessárias
- Configurado health checks com variáveis corretas
- Adicionado script `entrypoint.sh` para extrair config da DATABASE_URL

### 5. Ordem de Build no Dockerfile ✅
**Problema:** Copiava `package.json` antes de copiar `prisma/` directory

**Solução:**
- Reordenado COPY para copiar `prisma/` antes de executar `npm ci`

### 6. Health Checks Docker ✅
**Problema:** Sem health checks configurados

**Solução:**
- Adicionado health checks ao PostgreSQL (pg_isready)
- Adicionado health checks ao Redis (redis-cli ping)
- Adicionado health checks ao app (curl /api/health)
- Criado endpoint `/api/health` para verificação
- Configurado dependências com `condition: service_healthy`

### 7. Migrations Automáticas ✅
**Problema:** Migrations não eram executadas automaticamente no container

**Solução:**
- Criado script `entrypoint.sh` que:
  - Extrai config da DATABASE_URL
  - Aguarda o banco estar pronto
  - Executa `prisma migrate deploy`
  - Inicia a aplicação

### 8. Versão Docker Compose ✅
**Problema:** Aviso de atributo `version` obsoleto

**Solução:**
- Removido `version: '3.8'` dos arquivos docker-compose.yml

## 📁 Arquivos Criados/Atualizados

### Criados:
1. `app/api/health/route.js` - Endpoint de health check
2. `entrypoint.sh` - Script de inicialização do container
3. `Dockerfile.dev` - Dockerfile para desenvolvimento
4. `docker-compose.dev.yml` - Compose para desenvolvimento
5. `scripts/docker-start.sh` - Script para iniciar Docker
6. `scripts/docker-stop.sh` - Script para parar Docker
7. `docs/DOCKER_ATUALIZADO.md` - Documentação completa
8. `DOCKER_QUICKSTART.md` - Guia rápido
9. `DOCKER_CORRECOES.md` - Este documento

### Atualizados:
1. `package.json` - Adicionado `"type": "module"`
2. `next.config.js` - Adicionado `output: 'standalone'` e convertido para ESM
3. `Dockerfile` - Corrigido build multi-stage com Prisma
4. `Dockerfile.dev` - Corrigido ordem de build e postinstall
5. `docker-compose.yml` - Adicionado health checks e removido version
6. `docker-compose.dev.yml` - Adicionado health checks e removido version
7. `.dockerignore` - Melhorado para excluir arquivos desnecessários
8. `.env.docker` - Criado com variáveis configuradas

### Convertidos para ESM:
1. `lib/prisma.js`
2. `scripts/test.js`
3. `scripts/test-theme-colors.js`
4. `scripts/test-stripe-webhook.js`
5. `scripts/seed-themes-simple.js`

## 🚀 Como Usar

### Desenvolvimento (Recomendado para Testes)
```bash
# Iniciar todos os serviços
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar
docker-compose -f docker-compose.dev.yml down
```

### Produção
```bash
# Build e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## ✅ Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Reiniciar um serviço
docker-compose restart app

# Executar comando no container
docker-compose exec app sh

# Acessar Prisma Studio
docker-compose exec app npx prisma studio

# Acessar PostgreSQL
docker-compose exec db psql -U linkbio -d linkbio

# Ver logs de um serviço específico
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f redis
```

## 📊 Arquitetura Docker

### Serviços:
1. **linkbio-db** (PostgreSQL 15-alpine)
   - Porta: 5432
   - Volume: postgres_data
   - Health check: pg_isready

2. **linkbio-redis** (Redis 7-alpine)
   - Porta: 6379
   - Volume: redis_data
   - Health check: redis-cli ping

3. **linkbio-app** (Node.js 20-alpine)
   - Porta: 3000
   - Volume: upload_data
   - Health check: curl /api/health
   - Dependências: db, redis

### Build Process (Produção):
```
Stage 1 (Builder):
  1. Instalar dependências (npm ci --ignore-scripts)
  2. Copiar código fonte
  3. Executar postinstall (prisma generate)
  4. Build Next.js (npm run build)

Stage 2 (Runner):
  1. Copiar .next/standalone
  2. Copiar arquivos estáticos
  3. Instalar curl e postgresql-client
  4. Configurar entrypoint
  5. Executar app (npm start)
```

### Entrypoint Flow:
```
1. Extrair config da DATABASE_URL
2. Aguardar PostgreSQL estar pronto
3. Executar migrations (prisma migrate deploy)
4. Iniciar aplicação (npm start)
```

## 🎯 URLs de Acesso

- **Aplicação:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **Login:** http://localhost:3000/auth/login
- **Signup:** http://localhost:3000/auth/signup
- **Pricing:** http://localhost:3000/pricing

## 📝 Próximos Passos (Opcional)

1. Configurar credenciais reais do OAuth em `.env.docker`
2. Configurar chaves do Stripe em `.env.docker`
3. Gerar NEXTAUTH_SECRET: `openssl rand -base64 32`
4. Testar todos os endpoints
5. Configurar Nginx para produção (SSL, cache, etc.)
6. Configurar backup automático do banco de dados

## 🔍 Troubleshooting Rápido

### Erro: "Porta 3000 já está em uso"
```bash
docker-compose -f docker-compose.dev.yml down
```

### Erro: "Banco não está pronto"
```bash
docker-compose logs db
docker-compose logs app
```

### Erro: "Migrations falharam"
```bash
docker-compose exec app npx prisma migrate deploy
```

### Verificar status:
```bash
docker-compose ps
docker-compose logs -f
```

## 📚 Documentação

- `DOCKER_QUICKSTART.md` - Guia rápido de início
- `docs/DOCKER_ATUALIZADO.md` - Documentação completa
- `DOCKER_CORRECOES.md` - Este documento

## ✅ Status Final

- ✅ Build Docker funcional
- ✅ Migrations automáticas
- ✅ Health checks configurados
- ✅ Modo desenvolvimento com hot reload
- ✅ Modo produção otimizado
- ✅ Scripts de início/parada
- ✅ Documentação completa

**Docker está pronto para uso! 🎉**

Execute: `docker-compose -f docker-compose.dev.yml up -d`
