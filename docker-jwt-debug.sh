#!/bin/bash
# Script para verificar e diagnosticar problemas com JWT keys no Docker
# Uso: ./docker-jwt-debug.sh

echo "========================================"
echo "Docker JWT Debug Tool"
echo "========================================"
echo ""

# 1. Verificar .env local
echo "1. Verificando .env local..."
if [ -f .env ]; then
  echo "   ✅ .env encontrado"
  
  # Verificar se as chaves existem e têm conteúdo
  PRIVATE_KEY=$(grep "^JWT_PRIVATE_KEY_B64=" .env | cut -d'=' -f2)
  PUBLIC_KEY=$(grep "^JWT_PUBLIC_KEY_B64=" .env | cut -d'=' -f2)
  
  if [ -n "$PRIVATE_KEY" ]; then
    echo "   ✅ JWT_PRIVATE_KEY_B64 encontrado (${#PRIVATE_KEY} caracteres)"
  else
    echo "   ❌ JWT_PRIVATE_KEY_B64 vazio ou não encontrado"
  fi
  
  if [ -n "$PUBLIC_KEY" ]; then
    echo "   ✅ JWT_PUBLIC_KEY_B64 encontrado (${#PUBLIC_KEY} caracteres)"
  else
    echo "   ❌ JWT_PUBLIC_KEY_B64 vazio ou não encontrado"
  fi
else
  echo "   ❌ .env NÃO encontrado!"
  exit 1
fi
echo ""

# 2. Verificar se o backend container está rodando
echo "2. Verificando container backend..."
if docker ps | grep -q exchange-backend; then
  echo "   ✅ Container está rodando"
  
  # Verificar variáveis de ambiente DENTRO do container
  echo ""
  echo "3. Verificando variáveis de ambiente no container..."
  
  CONTAINER_PRIVATE=$(docker exec exchange-backend printenv JWT_PRIVATE_KEY_B64 2>/dev/null | head -c 50)
  CONTAINER_PUBLIC=$(docker exec exchange-backend printenv JWT_PUBLIC_KEY_B64 2>/dev/null | head -c 50)
  
  if [ -n "$CONTAINER_PRIVATE" ]; then
    echo "   ✅ JWT_PRIVATE_KEY_B64 no container: ${CONTAINER_PRIVATE}..."
  else
    echo "   ❌ JWT_PRIVATE_KEY_B64 está VAZIO no container!"
  fi
  
  if [ -n "$CONTAINER_PUBLIC" ]; then
    echo "   ✅ JWT_PUBLIC_KEY_B64 no container: ${CONTAINER_PUBLIC}..."
  else
    echo "   ❌ JWT_PUBLIC_KEY_B64 está VAZIO no container!"
  fi
  
  # Verificar todas as variáveis relacionadas a JWT
  echo ""
  echo "4. Todas as variáveis JWT no container:"
  docker exec exchange-backend env | grep -i jwt || echo "   (nenhuma encontrada)"
  
else
  echo "   ⚠️  Container NÃO está rodando"
  echo "   Inicie primeiro: ./start-after-pull-safe.sh"
fi

echo ""
echo "========================================"
echo "Diagnóstico"
echo "========================================"
echo ""

# Verificar se há diferença entre host e container
if [ -n "$PRIVATE_KEY" ] && [ -z "$CONTAINER_PRIVATE" ]; then
  echo "❌ PROBLEMA DETECTADO:"
  echo "   As chaves existem no .env local mas NÃO estão no container!"
  echo ""
  echo "🔧 Possíveis causas:"
  echo "   1. O docker-compose não está lendo o .env"
  echo "   2. As variáveis têm caracteres especiais que quebram o YAML"
  echo "   3. O arquivo .env tem formato incorreto"
  echo ""
  echo "🔧 Soluções:"
  echo "   A) Execute: docker-compose down && docker-compose up -d"
  echo "   B) Verifique se o .env está na pasta do docker-compose.yml"
  echo "   C) Use o modo de injeção direta (veja abaixo)"
  echo ""
  echo "🔧 Injeção direta (emergência):"
  echo "   ./docker-jwt-inject.sh"
fi

echo ""
echo "========================================"
