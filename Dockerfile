# Dockerfile para LinkBio Brasil

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências sem executar postinstall
RUN npm ci --ignore-scripts

# Copiar código fonte
COPY . .

# Executar postinstall para gerar Prisma
RUN npm run postinstall

# Build da aplicação Next.js
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar dependências essenciais
RUN apk add --no-cache curl postgresql-client

# Copiar arquivos do build standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./

# Tornar o entrypoint executável
RUN chmod +x entrypoint.sh

# Criar diretório de uploads
RUN mkdir -p public/uploads/avatars public/uploads/backgrounds

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Usar o entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
