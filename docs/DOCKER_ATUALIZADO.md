> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# Docker - LinkBio Brasil 🐳

## 📋 Visão Geral

Este documento descreve como usar Docker para rodar o LinkBio Brasil em diferentes ambientes: desenvolvimento e produção.

**Status: ✅ PRONTO PARA USO** (Atualizado em 03/03/2026)

## 🚀 Modos de Uso

### 1. Modo Desenvolvimento (Recomendado para Testes)

Use este modo para desenvolver e testar o projeto com hot reload.

```bash
# Iniciar todos os serviços (banco, redis e app)
docker-compose -f docker-compose.dev.yml up

# Em modo detached (background)
docker-compose -f docker-compose.dev.yml up -d

# Parar serviços
docker-compose -f docker-compose.dev.yml down

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f
```

**Características do modo desenvolvimento:**
- ✅ Hot reload automático
- ✅ Volumes mapeados para edição local
- ✅ Modo Next.js dev ativado
- ✅ Logs em tempo real
- ⚠️ Não otimizado para produção

### 2. Modo Produção

Use este modo para deploy em produção.

```bash
# Build e subir produção
docker-compose up --build

# Em modo detached
docker-compose up -d --build

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f
```

**Características do modo produção:**
- ✅ Build otimizado (standalone)
- ✅ Migrations automáticas
- ✅ Health checks configurados
- ✅ Performance otimizada
- ✅ Docker multi-stage build

## 📁 Arquivos Docker

| Arquivo | Descrição |
|---------|-----------|
| `Dockerfile` | Build de produção (multi-stage) |
| `Dockerfile.dev` | Build de desenvolvimento |
| `docker-compose.yml` | Compose de produção |
| `docker-compose.dev.yml` | Compose de desenvolvimento |
| `.env.docker` | Variáveis de ambiente |
| `.dockerignore` | Arquivos ignorados no build |
| `entrypoint.sh` | Script de inicialização |

## 🔧 Variáveis de Ambiente

As variáveis de ambiente estão configuradas em `.env.docker`:

```bash
# Database
DB_USER=linkbio
DB_PASSWORD=linkbio_password
DB_NAME=linkbio
DATABASE_URL=postgresql://linkbio:linkbio_password@db:5432/linkbio

# NextAuth
NEXTAUTH_SECRET=sua-chave-secreta-muito-longa-aleatoria
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (configure com suas credenciais)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Stripe (configure com suas chaves)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## 📊 Serviços Docker

### linkbio-db (PostgreSQL)
- **Imagem:** postgres:15-alpine
- **Porta:** 5432
- **Health Check:** pg_isready
- **Volume:** postgres_data (persistente)

### linkbio-redis (Redis)
- **Imagem:** redis:7-alpine
- **Porta:** 6379
- **Health Check:** redis-cli ping
- **Volume:** redis_data (persistente)

### linkbio-app (Next.js)
- **Imagem:** node:20-alpine
- **Porta:** 3000
- **Health Check:** curl /api/health
- **Depende de:** db, redis
- **Volumes:** upload_data (persistente)

## 🔍 Troubleshooting

### Problema: "Prisma Client needs to be constructed..."
**Solução:** Adicionado `"type": "module"` ao package.json. Convertido lib/prisma.js para ESM.

### Problema: "Postgres não está pronto"
**Solução:** O entrypoint.sh espera o banco estar pronto. Verifique os logs:
```bash
docker-compose logs db
```

### Problema: "Migrations não executadas"
**Solução:** O entrypoint.sh executa `prisma migrate deploy` automaticamente. Se falhar, execute manualmente:
```bash
docker-compose exec app npx prisma migrate deploy
```

### Problema: "Porta 3000 já está em uso"
**Solução:** Pare o processo local ou mude a porta no docker-compose.yml:
```yaml
ports:
  - "3001:3000"  # Use localhost:3001
```

### Problema: "Permissão negada no entrypoint.sh"
**Solução:** O Dockerfile já inclui `chmod +x entrypoint.sh`, mas se ainda falhar:
```bash
chmod +x entrypoint.sh
docker-compose up --build
```

## 📝 Comandos Úteis

### Ver status dos containers
```bash
docker-compose ps
```

### Ver logs de um serviço específico
```bash
docker-compose logs -f app    # Aplicação
docker-compose logs -f db     # Banco de dados
docker-compose logs -f redis  # Redis
```

### Executar comandos dentro de um container
```bash
# Shell no container app
docker-compose exec app sh

# Prisma Studio
docker-compose exec app npx prisma studio

# Executar migrations manualmente
docker-compose exec app npx prisma migrate deploy

# Acessar PostgreSQL
docker-compose exec db psql -U linkbio -d linkbio
```

### Limpar volumes e reconstruir do zero
```bash
docker-compose down -v
docker-compose up --build
```

### Acompanhar recursos dos containers
```bash
docker stats
```

## 🔐 Acesso aos Serviços

- **Aplicação:** http://localhost:3000
- **Prisma Studio:** `docker-compose exec app npx prisma studio`
- **PostgreSQL:** `docker-compose exec db psql -U linkbio -d linkbio`
- **Redis:** `docker-compose exec redis redis-cli`

## 📦 Build Process

### Produção (Multi-stage Build)

**Stage 1 - Builder:**
- Instala todas as dependências
- Copia o código fonte
- Gera cliente Prisma
- Build do Next.js (standalone)

**Stage 2 - Runner:**
- Copia apenas o necessário
- Instala dependências mínimas
- Configura entrypoint
- Executa npm start

### Desenvolvimento

- Single-stage build
- Instala dependências de desenvolvimento
- Configura volumes para hot reload
- Executa npm run dev

## 🚀 Deploy em Produção

### Docker (Básico)

```bash
# 1. Configure .env.docker com suas credenciais reais
# 2. Build e suba os containers
docker-compose up -d --build

# 3. Verifique se tudo está rodando
docker-compose ps
```

### Docker com Nginx (Recomendado)

```bash
# Crie nginx.conf e adicione ao docker-compose.yml
# Isso fornecerá SSL, cache e reverse proxy
```

### Cloud Providers

- **AWS ECS:** Use docker-compose up e push para ECR
- **Google Cloud Run:** Use docker build e gcloud run deploy
- **Azure Container Instances:** Use docker compose up e az container create

## 📈 Performance e Monitoramento

### Health Checks

Todos os serviços têm health checks configurados:

```bash
# Ver health status
docker-compose ps
```

### Logs

```bash
# Logs em tempo real
docker-compose logs -f

# Logs dos últimos 100 linhas
docker-compose logs --tail=100

# Logs de um serviço
docker-compose logs app
```

### Metrics

```bash
# Ver uso de recursos
docker stats
```

## 🔄 Backup e Restore

### Backup do banco de dados

```bash
# Dump do banco
docker-compose exec db pg_dump -U linkbio linkbio > backup.sql

# Copiar dump para fora do container
docker cp linkbio-db:/backup.sql ./backup.sql
```

### Restore do banco de dados

```bash
# Copiar dump para dentro do container
docker cp ./backup.sql linkbio-db:/backup.sql

# Restore
docker-compose exec db psql -U linkbio -d linkbio < /backup.sql
```

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/docker)

## 🐛 Problemas Conhecidos

1. **Node.js Version:** Prisma 7.x requer Node.js 20+. O Dockerfile usa node:20-alpine. ✅ RESOLVIDO
2. **ESM/CommonJS:** Conflito de módulos. Adicionado `"type": "module"` ao package.json. ✅ RESOLVIDO
3. **Next.js Standalone:** Configurado `output: 'standalone'` no next.config.js. ✅ RESOLVIDO
4. **Prisma Migrations:** Entrypoint script executa migrations automaticamente. ✅ RESOLVIDO

## ✅ Checklist Antes do Deploy

- [ ] Configurar todas as variáveis de ambiente em .env.docker
- [ ] Configurar credenciais do Google OAuth (se necessário)
- [ ] Configurar credenciais do GitHub OAuth (se necessário)
- [ ] Configurar chaves do Stripe (se necessário)
- [ ] Gerar NEXTAUTH_SECRET com comando: `openssl rand -base64 32`
- [ ] Testar build local: `docker-compose up --build`
- [ ] Verificar health checks: `docker-compose ps`
- [ ] Verificar logs: `docker-compose logs`
- [ ] Testar endpoints principais
- [ ] Backup do banco de dados antes de produção

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `docker-compose logs`
2. Verifique o status: `docker-compose ps`
3. Consulte a seção de Troubleshooting acima
4. Verifique a documentação do Prisma e Next.js

---

**Última atualização:** 03/03/2026
**Versão do Docker:** 3.8+
**Versão do Docker Compose:** 2.0+
**Imagem Base:** node:20-alpine
**Sistema Operacional:** Linux/Alpine
