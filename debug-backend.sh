#!/bin/bash
# Script para debugar o backend quando está em loop de reinício
# Uso: ./debug-backend.sh

echo "========================================"
echo "Backend Debug Tool"
echo "========================================"
echo ""

# Parar o backend se estiver rodando
echo "1. Parando backend..."
docker-compose stop backend 2>/dev/null || true

echo ""
echo "2. Removendo container antigo..."
docker rm -f exchange-backend 2>/dev/null || true

echo ""
echo "3. Iniciando backend em modo foreground (para ver logs)..."
echo "   Pressione Ctrl+C para parar"
echo ""
echo "========================================"

# Rodar o backend sem detached mode para ver os logs
docker-compose up backend
