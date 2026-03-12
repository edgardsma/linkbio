> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# 🐳 Docker - LinkBio Brasil

## 📋 Status

✅ **Docker configurado** para desenvolvimento e produção

## 🚀 Como Usar Docker

### Opção 1: Desenvolvimento (Recomendado)

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ver logs em tempo real
docker-compose logs -f app

# Parar todos os serviços
docker-compose down
```

### Opção 2: Produção (Build e Deploy)

```bash
# Build da imagem
docker build -t linkbio-brasil:latest .

# Criar containers
docker-compose up -d

# Ver status
docker-compose ps
```

### Opção 3: Apenas Banco de Dados

```bash
# Iniciar apenas o PostgreSQL
docker-compose up -d db

# Conectar ao banco
docker exec -it linkbio-db psql -U linkbio -d linkbio
```

---

## 📁 Arquivos Docker

| Arquivo | Descrição |
|---------|-----------|
| `Dockerfile` | Configuração da imagem Docker |
| `docker-compose.yml` | Orquestração de serviços (app, db, redis) |
| `.env.docker` | Variáveis de ambiente para Docker |
| `.dockerignore` | Arquivos ignorados no build Docker |

---

## 🔧 Serviços Configurados

### 1. App (Next.js)
- **Imagem**: node:18-alpine
- **Porta**: 3000
- **Variáveis**: NODE_ENV, DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
- **Dependências**: db

### 2. Database (PostgreSQL)
- **Imagem**: postgres:15-alpine
- **Porta**: 5432
- **Variáveis**: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
- **Volumes**: postgres_data

### 3. Redis (Opcional)
- **Imagem**: redis:7-alpine
- **Porta**: 6379
- **Volumes**: redis_data

---

## 🔗 Acessando o Sistema

Após iniciar o Docker:

- **Dashboard**: http://localhost:3000/dashboard
- **Login**: http://localhost:3000/auth/signin
- **Cadastro**: http://localhost:3000/auth/signup
- **Preços**: http://localhost:3000/pricing

---

## 🔧 Comandos Úteis

```bash
# Build da imagem Docker
docker build -t linkbio-brasil .

# Iniciar todos os serviços em background
docker-compose up -d

# Ver logs de todos os serviços
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs app

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (cuidado: perde dados!)
docker-compose down -v

# Reiniciar um serviço
docker-compose restart app

# Executar comando em um container
docker exec -it linkbio-app sh

# Acessar o PostgreSQL diretamente
docker exec -it linkbio-db psql -U linkbio -d linkbio

# Verificar volumes
docker volume ls

# Verificar imagens
docker images

# Limpar imagens não usadas
docker image prune -a
```

---

## 🔧 Configuração de Variáveis de Ambiente

Edite `.env.docker` para configurar:

```env
# Database
DB_USER=linkbio
DB_PASSWORD=linkbio_password
DB_NAME=linkbio

# NextAuth (gere uma chave secreta longa)
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# OAuth Providers (opcional)
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GITHUB_CLIENT_ID=seu-github-client-id
GITHUB_CLIENT_SECRET=seu-github-client-secret
```

Para gerar uma chave secreta segura:
```bash
openssl rand -base64 32
```

---

## 🚀 Deploy em Produção

### 1. VPS (Virtual Private Server)

```bash
# No servidor VPS
git clone seu-repo.git
cd linkbio-brasil

# Configurar variáveis de produção
cp .env.docker.example .env.production
# Editar .env.production com suas credenciais

# Iniciar serviços
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

### 2. Nginx (Proxy Reverso)

Crie `/etc/nginx/sites-available/linkbio-brasil`:

```nginx
upstream linkbio_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://linkbio_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. SSL com Certbot

```bash
# Instalar certificado SSL gratuito
sudo certbot --nginx -d seu-dominio.com

# Nginx será configurado automaticamente
```

---

## 🔍 Debug e Troubleshooting

### Ver logs de containers

```bash
# Logs da aplicação
docker-compose logs app

# Logs do banco de dados
docker-compose logs db

# Logs do Redis
docker-compose logs redis

# Logs de todos os serviços
docker-compose logs -f
```

### Verificar status dos serviços

```bash
docker-compose ps
```

### Entrar em um container

```bash
# Entrar na aplicação
docker exec -it linkbio-app sh

# Entrar no banco
docker exec -it linkbio-db psql -U linkbio -d linkbio

# Entrar no Redis
docker exec -it linkbio-redis sh
```

### Reconstruir serviço específico

```bash
docker-compose up -d --build app
```

---

## 📊 Monitoramento

### Ver uso de recursos

```bash
# Estatísticas dos containers
docker stats

# Uso de disco dos volumes
docker system df -v

# Uso de espaço
docker system df
```

---

## 🗑️ Limpeza

```bash
# Parar e remover containers
docker-compose down

# Remover volumes (cuidado!)
docker-compose down -v

# Remover imagens não usadas
docker image prune -a

# Remover containers parados
docker container prune

# Limpeza completa do sistema Docker
docker system prune -a --volumes
```

---

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas em `.env.docker`
- [ ] Build da imagem testado (`docker build -t linkbio-brasil .`)
- [ ] `docker-compose up -d` funciona localmente
- [ ] Variáveis de produção configuradas
- [ ] VPS acessível (SSH configurado)
- [ ] Docker instalado no servidor
- [ ] Clone do repositório feito
- [ ] `docker-compose up -d` executado no VPS
- [ ] Nginx configurado como proxy reverso
- [ ] SSL configurado (HTTPS)
- [ ] Domínio apontado para o IP do VPS
- [ ] Aplicação acessível em `https://seu-dominio.com`
- [ ] Banco de dados acessível e funcionando
- [ ] Uploads de arquivos funcionando
- [ ] Logs monitorados
- [ ] Backup automático configurado

---

**🐳 Docker está pronto para uso!**
