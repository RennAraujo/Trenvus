#!/bin/bash
# Script para forçar rebuild completo do frontend (sem cache)
# Uso: ./rebuild-frontend.sh

echo "========================================"
echo "Rebuild Frontend (Sem Cache)"
echo "========================================"
echo ""

echo "1. Parando containers..."
docker-compose -f docker-compose.envfile.yml stop frontend 2>/dev/null || docker-compose stop frontend 2>/dev/null || true

echo ""
echo "2. Removendo container frontend..."
docker rm -f exchange-frontend 2>/dev/null || true

echo ""
echo "3. Removendo imagem antiga..."
docker rmi trenvus-frontend 2>/dev/null || true
docker rmi trenvus_frontend 2>/dev/null || true

echo ""
echo "4. Limpando cache de build..."
docker builder prune -f 2>/dev/null || true

echo ""
echo "5. Rebuildando frontend (sem cache)..."
docker-compose -f docker-compose.envfile.yml build --no-cache frontend 2>/dev/null || docker-compose build --no-cache frontend

echo ""
echo "6. Iniciando frontend..."
docker-compose -f docker-compose.envfile.yml up -d frontend 2>/dev/null || docker-compose up -d frontend

echo ""
echo "7. Aguardando..."
sleep 10

echo ""
echo "8. Verificando status..."
docker ps | grep exchange-frontend

echo ""
echo "========================================"
echo "✅ Frontend rebuildado!"
echo "========================================"
echo ""
echo "Acesse: http://localhost:3000"
echo ""
echo "💡 Dica: Limpe o cache do navegador (Ctrl+F5)"
echo ""
