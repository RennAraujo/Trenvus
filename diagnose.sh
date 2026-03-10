#!/bin/bash
# Script de diagnóstico para Trenvus

set -e

echo "========================================"
echo "Diagnóstico Trenvus"
echo "========================================"
echo ""

# Verificar Docker
echo "1. Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado"
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado"
    exit 1
fi
echo "✅ Docker e Docker Compose OK"
echo ""

# Verificar containers
echo "2. Verificando containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(exchange|trenvus)" || echo "ℹ️ Nenhum container do Trenvus rodando"
echo ""

# Verificar logs do backend se estiver rodando
echo "3. Logs do backend (últimas 50 linhas)..."
if docker ps | grep -q exchange-backend; then
    docker logs --tail 50 exchange-backend 2>&1 | tail -50 || echo "⚠️ Não foi possível obter logs"
else
    echo "⚠️ Backend não está rodando"
fi
echo ""

# Verificar uso de recursos
echo "4. Uso de recursos..."
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep -E "(exchange|trenvus|NAME)" || echo "ℹ️ Sem containers para mostrar stats"
echo ""

# Verificar banco de dados
echo "5. Testando conexão com banco..."
if docker ps | grep -q exchange-db; then
    docker exec -i exchange-db pg_isready -U postgres 2>/dev/null && echo "✅ Banco de dados OK" || echo "⚠️ Banco não está respondendo"
else
    echo "⚠️ Container do banco não está rodando"
fi
echo ""

# Verificar variáveis de ambiente no .env
echo "6. Verificando .env..."
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado"
    echo "   Variáveis configuradas:"
    grep -E "^(TEST_ACCOUNT|JWT|ADMIN)" .env | cut -d= -f1 | sed 's/^/   - /' || true
else
    echo "⚠️ Arquivo .env não encontrado"
    echo "   Crie um arquivo .env baseado no .env.example"
fi
echo ""

# Verificar saúde do backend
echo "7. Verificando saúde do backend..."
if docker ps | grep -q exchange-backend; then
    curl -s http://localhost:8080/actuator/health 2>/dev/null | head -20 || echo "⚠️ Health check falhou"
else
    echo "⚠️ Backend não está rodando"
fi
echo ""

# Verificar contas de teste no banco
echo "8. Verificando contas de teste no banco..."
if docker ps | grep -q exchange-db; then
    docker exec -i exchange-db psql -U postgres -d exchange -c "SELECT email, role, nickname FROM users WHERE email LIKE '%@test.com' ORDER BY email;" 2>/dev/null || echo "⚠️ Não foi possível consultar usuários"
else
    echo "⚠️ Banco não disponível"
fi
echo ""

echo "========================================"
echo "Diagnóstico concluído"
echo "========================================"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs backend: docker logs -f exchange-backend"
echo "  - Ver logs banco:   docker logs -f exchange-db"
echo "  - Reiniciar tudo:   ./start-after-pull.sh"
echo "  - Limpar Docker:    docker system prune -af"
echo "========================================"
