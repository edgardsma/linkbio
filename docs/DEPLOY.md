# Guia de Deploy - LinkBio Brasil

## 🚀 Deploy em Produção

### Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Domínio configurado
- SSL (HTTPS) habilitado

---

## 🐳 Deploy com Docker

### 1. Preparar o ambiente

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/linkbio-brasil.git
cd linkbio-brasil
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edit o arquivo `.env` com suas credenciais reais de produção:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@host:5432/database"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-producao"
NEXTAUTH_URL="https://seu-dominio.com"

# OAuth (opcional)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

GITHUB_CLIENT_ID="seu-github-client-id"
GITHUB_CLIENT_SECRET="seu-github-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Executar migrations

```bash
# Com Docker
docker-compose run app npx prisma migrate deploy

# Sem Docker
npx prisma migrate deploy
```

### 4. Iniciar containers

```bash
docker-compose up -d
```

### 5. Verificar status

```bash
docker-compose ps
```

---

## ☁️ Deploy em Vercel

### 1. Preparar o projeto

```bash
# Instalar dependências
npm install

# Build local para testar
npm run build
```

### 2. Configurar Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### 3. Configurar variáveis de ambiente no Vercel

No painel do Vercel:
1. Acesse Settings > Environment Variables
2. Adicione as mesmas variáveis do `.env`
3. Deploy novamente

### 4. Configurar banco de dados

Para produção, use um banco PostgreSQL gerenciado:
- [Vercel Postgres](https://vercel.com/postgres)
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

---

## 🌐 Deploy em Servidor VPS

### 1. Preparar servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### 2. Configurar firewall

```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 3. Clonar e configurar projeto

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/linkbio-brasil.git
cd linkbio-brasil

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
nano .env  # Editar com suas credenciais
```

### 4. Executar migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Criar build

```bash
npm run build
```

### 6. Iniciar com PM2

```bash
pm2 start npm --name "linkbio" -- start
pm2 save
pm2 startup
```

---

## 🔒 Configurar SSL com Nginx

### 1. Instalar Nginx e Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/linkbio
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Habilitar site

```bash
sudo ln -s /etc/nginx/sites-available/linkbio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Obter certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com
```

---

## 📊 Monitoramento

### Logs

```bash
# PM2
pm2 logs linkbio

# Docker
docker-compose logs -f app
```

### Status

```bash
# PM2
pm2 status

# Docker
docker-compose ps
```

---

## 🔧 Backup

### Backup do Banco de Dados

```bash
# Manual
pg_dump -U usuario -d database > backup.sql

# Automatizado (crontab)
0 2 * * * pg_dump -U usuario -d database > /backups/backup-$(date +\%Y\%m\%d).sql
```

---

## 🎯 Boas Práticas

1. **Sempre use HTTPS** em produção
2. **Configure backups automáticos**
3. **Use variáveis de ambiente** para segredos
4. **Atualize dependências** regularmente
5. **Monitore logs e erros**
6. **Implemente rate limiting**
7. **Use CDN para assets estáticos**

---

## 🆘 Troubleshooting

### Erro: Database connection failed

Verifique se o PostgreSQL está rodando:
```bash
sudo systemctl status postgresql
```

### Erro: Port already in use

Mate o processo que está usando a porta 3000:
```bash
sudo lsof -ti:3000 | xargs kill -9
```

### Erro: NextAuth configuration error

Verifique as variáveis de ambiente:
```bash
pm2 env 0  # Verificar variáveis no PM2
```

---

## 📚 Recursos Adicionais

- [Next.js Deploy](https://nextjs.org/docs/deployment)
- [Prisma Deploy](https://www.prisma.io/docs/guides/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
