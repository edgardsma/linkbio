> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# 🐳 Docker Quick Start - LinkBio Brasil

## ⚡ Modo Rápido (Desenvolvimento)

```bash
# Iniciar tudo (banco, redis e app)
docker-compose -f docker-compose.dev.yml up

# Ou em background
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar tudo
docker-compose -f docker-compose.dev.yml down
```

## 🚀 Modo Produção

```bash
# Build e iniciar produção
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down
```

## 📱 Acesse o Aplicativo

- **App:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **Login:** http://localhost:3000/auth/login

## 🛠️ Comandos Úteis

```bash
# Ver status
docker-compose ps

# Reiniciar app
docker-compose restart app

# Executar no container
docker-compose exec app sh

# Prisma Studio
docker-compose exec app npx prisma studio

# Banco de dados
docker-compose exec db psql -U linkbio -d linkbio

# Logs de um serviço
docker-compose logs app
docker-compose logs db
```

## 📚 Documentação Completa

Para mais detalhes, consulte: `docs/DOCKER_ATUALIZADO.md`

---

**Pronto para começar?** Execute: `docker-compose -f docker-compose.dev.yml up`
