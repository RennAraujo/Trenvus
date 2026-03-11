#!/bin/bash
# Script para carregar variáveis do .env e exportar para o docker-compose
# Uso: ./docker-env-load.sh

echo "========================================"
echo "Docker Environment Loader"
echo "========================================"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "❌ .env não encontrado!"
  exit 1
fi

echo "Carregando variáveis do .env..."
echo ""

# Carregar variáveis do .env
set -a
source .env
set +a

echo "✅ Variáveis carregadas:"
echo ""

# Verificar JWT keys
if [ -n "$JWT_PRIVATE_KEY_B64" ]; then
  echo "  JWT_PRIVATE_KEY_B64: ${#JWT_PRIVATE_KEY_B64} caracteres"
else
  echo "  ❌ JWT_PRIVATE_KEY_B64: VAZIO"
fi

if [ -n "$JWT_PUBLIC_KEY_B64" ]; then
  echo "  JWT_PUBLIC_KEY_B64: ${#JWT_PUBLIC_KEY_B64} caracteres"
else
  echo "  ❌ JWT_PUBLIC_KEY_B64: VAZIO"
fi

echo ""
echo "Agora execute:"
echo "  docker-compose down"
echo "  docker-compose up -d"
echo ""
echo "Ou simplesmente:"
echo "  ./start-after-pull-safe.sh"
