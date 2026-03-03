#!/bin/bash

# Script para iniciar o projeto LinkBio Brasil com Docker
# Uso: ./scripts/docker-start.sh [dev|prod]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar modo de execução
MODE=${1:-dev}

if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
    print_error "Modo inválido. Use: dev ou prod"
    exit 1
fi

print_info "Iniciando LinkBio Brasil em modo: $MODE"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando. Inicie o Docker Desktop e tente novamente."
    exit 1
fi

print_success "Docker está rodando"

# Verificar se .env.docker existe
if [ ! -f .env.docker ]; then
    print_error ".env.docker não encontrado"
    print_info "Criando .env.docker a partir de .env.docker.example..."
    if [ -f .env.docker.example ]; then
        cp .env.docker.example .env.docker
        print_success ".env.docker criado"
        print_warning "Edite .env.docker com suas credenciais"
    else
        print_error ".env.docker.example não encontrado"
        exit 1
    fi
fi

# Limpar containers antigos (opcional)
read -p "Deseja parar containers existentes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Parando containers existentes..."
    docker-compose -f docker-compose.$MODE.yml down
    print_success "Containers parados"
fi

# Build e subir containers
print_info "Buildando containers..."
docker-compose -f docker-compose.$MODE.yml build

print_info "Subindo containers..."
docker-compose -f docker-compose.$MODE.yml up -d

# Esperar containers iniciarem
print_info "Aguardando containers iniciarem..."
sleep 5

# Verificar status
print_info "Verificando status dos containers..."
docker-compose -f docker-compose.$MODE.yml ps

# Mostrar URLs
echo ""
print_success "LinkBio Brasil iniciado com sucesso!"
echo ""
echo "📱 URLs disponíveis:"
echo "   Aplicação:  http://localhost:3000"
echo "   Dashboard:  http://localhost:3000/dashboard"
echo "   Login:      http://localhost:3000/auth/login"
echo "   Signup:     http://localhost:3000/auth/signup"
echo ""

# Mostrar comandos úteis
echo "🛠️  Comandos úteis:"
echo "   Ver logs:           docker-compose -f docker-compose.$MODE.yml logs -f"
echo "   Parar:              docker-compose -f docker-compose.$MODE.yml down"
echo "   Reiniciar:          docker-compose -f docker-compose.$MODE.yml restart"
echo "   Executar no app:     docker-compose -f docker-compose.$MODE.yml exec app sh"
echo "   Prisma Studio:      docker-compose -f docker-compose.$MODE.yml exec app npx prisma studio"
echo ""

# Verificar health checks
print_info "Verificando health checks..."
sleep 10

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Aplicação está saudável! 🎉"
else
    print_warning "Aplicação ainda não está pronta. Verifique os logs:"
    echo "   docker-compose -f docker-compose.$MODE.yml logs -f"
fi

echo ""
print_success "Divirta-se! 🚀"
