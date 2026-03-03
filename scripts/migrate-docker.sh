#!/bin/sh

# Script de Migrações do Banco de Dados - LinkBio Brasil
# Para uso com Docker Compose

set -e

echo "🗄️ Iniciando migrações do banco de dados..."

# Aguardar o banco de dados estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 10

# Executar migrações do Prisma
npx prisma migrate deploy

# Verificar resultado
if [ $? -eq 0 ]; then
  echo "✅ Migrações executadas com sucesso!"
  echo "📊 Banco de dados configurado e atualizado."
else
  echo "❌ Erro ao executar migrações: $?"
  exit 1
fi

echo "🚀 Inicializando dados de teste..."

# Verificar se existem usuários de teste
npx prisma db execute --stdin << EOF
SELECT COUNT(*) as count FROM "User";
EOF

echo "📊 Status inicial:"
echo "  - PostgreSQL: ✅ Conectado"
echo "  - Migrações: ✅ Executadas"
echo "  - Prisma: ✅ Configurado"
echo "  - Inicialização de dados: Iniciando..."
echo ""
echo "🌐 Serviços rodando em:"
echo "  - http://localhost:3000 (Docker)"
echo "  - http://localhost:3001 (Local - Prisma Dev)"
echo "  - PostgreSQL: 51213 (Prisma Dev)"
echo ""
echo "✅ Pronto para uso!"
