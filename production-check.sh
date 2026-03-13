#!/bin/bash
# Script para verificar problemas em produção

echo "=========================================="
echo "Trenvus Production Troubleshooting"
echo "=========================================="

# Verificar se .env.backend existe
echo ""
echo "1. Verificando .env.backend..."
if [ -f ".env.backend" ]; then
    echo "   ✓ .env.backend existe"
    echo "   Tamanho: $(wc -c < .env.backend) bytes"
else
    echo "   ✗ .env.backend NÃO EXISTE!"
    echo "   Crie o arquivo .env.backend antes de rodar docker compose"
fi

# Verificar containers
echo ""
echo "2. Verificando containers Docker..."
docker ps -a | grep -E "exchange|trenvus" || echo "   Nenhum container encontrado"

# Verificar logs do backend
echo ""
echo "3. Logs do backend (últimas 20 linhas)..."
docker logs exchange-backend --tail 20 2>/dev/null || echo "   Container backend não encontrado"

# Verificar logs do frontend
echo ""
echo "4. Logs do frontend (últimas 20 linhas)..."
docker logs exchange-frontend --tail 20 2>/dev/null || echo "   Container frontend não encontrado"

# Verificar se portas estão em uso
echo ""
echo "5. Verificando portas..."
echo "   Porta 3000 (frontend):"
netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp | grep :3000 || echo "     Não está em uso"
echo "   Porta 8080 (backend):"
netstat -tlnp 2>/dev/null | grep :8080 || ss -tlnp | grep :8080 || echo "     Não está em uso"

# Verificar espaço em disco
echo ""
echo "6. Espaço em disco:"
df -h | grep -E "^/dev/"

echo ""
echo "=========================================="
echo "Para corrigir problemas comuns:"
echo "=========================================="
echo ""
echo "1. Se .env.backend não existe:"
echo "   cp .env.backend.example .env.backend"
echo "   # Edite .env.backend com suas configurações"
echo ""
echo "2. Para rebuild completo:"
echo "   docker compose down -v"
echo "   docker compose up -d --build"
echo ""
echo "3. Para ver logs em tempo real:"
echo "   docker compose logs -f backend"
echo "   docker compose logs -f frontend"
