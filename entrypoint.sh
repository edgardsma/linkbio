#!/bin/sh

set -e

# Extrair informações da DATABASE_URL
# Formato esperado: postgresql://user:password@host:port/dbname
DB_USER=$(echo $DATABASE_URL | awk -F'//' '{print $2}' | awk -F':' '{print $1}')
DB_PASSWORD=$(echo $DATABASE_URL | awk -F':' '{print $3}' | awk -F'@' '{print $1}')
DB_HOST=$(echo $DATABASE_URL | awk -F'@' '{print $2}' | awk -F':' '{print $1}')
DB_PORT=$(echo $DATABASE_URL | awk -F':' '{print $4}' | awk -F'/' '{print $1}')
DB_NAME=$(echo $DATABASE_URL | awk -F'/' '{print $4}')

echo "📊 Configuração do banco:"
echo "   Host: $DB_HOST"
echo "   Porta: $DB_PORT"
echo "   Database: $DB_NAME"

# Função para aguardar o banco de dados
wait_for_db() {
  echo "⏳ Aguardando o banco de dados..."
  until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
    echo "Postgres ainda não está pronto - aguardando..."
    sleep 2
  done
  echo "✅ Banco de dados pronto!"
}

# Executar migrações do Prisma
run_migrations() {
  echo "🔄 Executando migrações do Prisma..."
  if npx prisma migrate deploy; then
    echo "✅ Migrations executadas com sucesso!"
  else
    echo "⚠️  Erro ao executar migrations (pode ser normal se já estiverem aplicadas)"
  fi
}

# Iniciar aplicação
start_app() {
  echo "🚀 Iniciando aplicação na porta 3000..."
  exec npm start
}

# Main
wait_for_db
run_migrations
start_app

