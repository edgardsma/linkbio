#!/bin/bash

# Script para parar o projeto LinkBio Brasil com Docker
# Uso: ./scripts/docker-stop.sh [dev|prod]

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

print_info "Parando LinkBio Brasil em modo: $MODE"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando."
    exit 1
fi

# Verificar se containers existem
if ! docker-compose -f docker-compose.$MODE.yml ps -q > /dev/null 2>&1; then
    print_warning "Nenhum container rodando em modo $MODE"
    exit 0
fi

# Parar containers
print_info "Parando containers..."
docker-compose -f docker-compose.$MODE.yml down

print_success "Containers parados"

# Opção de limpar volumes
read -p "Deseja remover volumes também? (Isso apagará todos os dados!) (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Removendo volumes..."
    docker-compose -f docker-compose.$MODE.yml down -v
    print_success "Volumes removidos"
fi

print_success "LinkBio Brasil parado com sucesso! 👋"
