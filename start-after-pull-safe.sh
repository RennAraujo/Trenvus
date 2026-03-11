#!/bin/bash
# Script seguro para reiniciar Trenvus após git pull
# PRESERVA os dados do banco - não usa -v no down
# Uso: ./start-after-pull-safe.sh [--reset-data]

set -e

RESET_DATA=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --reset-data)
      RESET_DATA=true
      shift
      ;;
  esac
done

echo "========================================"
echo "Reiniciando Trenvus (MODO SEGURO)"
echo "========================================"
echo ""

if [ "$RESET_DATA" = true ]; then
  echo "⚠️  AVISO: Reset de dados solicitado!"
  echo "   Isso vai APAGAR todos os dados do banco."
  read -p "   Tem certeza? (sim/N): " confirm
  if [ "$confirm" != "sim" ]; then
    echo "   Cancelado."
    exit 1
  fi
  echo ""
fi

echo "1. Verificando .env local..."
if [ ! -f .env ]; then
  echo "   ⚠️  .env não encontrado! Copiando de .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "   ✅ .env criado de .env.example"
    echo "   ⚠️  IMPORTANTE: Edite o .env e configure suas variáveis!"
  else
    echo "   ❌ .env.example também não encontrado!"
    exit 1
  fi
else
  echo "   ✅ .env local preservado"
fi
echo ""

echo "2. Fazendo backup do .env atual..."
cp .env .env.local.backup.$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup criado: .env.local.backup.$(date +%Y%m%d_%H%M%S)"
echo ""

if [ "$RESET_DATA" = true ]; then
  echo "3. Parando containers e REMOVENDO VOLUMES (reset total)..."
  docker-compose down -v
else
  echo "3. Parando containers (PRESERVANDO dados)..."
  docker-compose down
fi

echo ""
echo "4. Removendo containers órfãos..."
docker rm -f exchange-db exchange-backend exchange-frontend 2>/dev/null || true

echo ""
echo "5. Limpando imagens antigas (opcional)..."
docker image prune -f 2>/dev/null || true

echo ""
echo "6. Subindo containers com build..."
docker-compose up --build -d

echo ""
echo "7. Aguardando serviços iniciarem..."
echo "   - Banco de dados (15s)..."
sleep 15

echo "   - Backend e migrações (20s)..."
sleep 20

echo ""
echo "8. Verificando saúde dos serviços..."
echo ""

# Check database
if docker ps | grep -q exchange-db; then
  echo "   ✅ PostgreSQL está rodando"
else
  echo "   ❌ PostgreSQL NÃO está rodando!"
fi

# Check backend
if docker ps | grep -q exchange-backend; then
  echo "   ✅ Backend está rodando"
  
  # Check if backend is healthy
  echo ""
  echo "   Testando endpoint de saúde..."
  for i in 1 2 3 4 5; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
      echo "   ✅ Backend está respondendo"
      break
    else
      echo "   ⏳ Aguardando backend... ($i/5)"
      sleep 5
    fi
  done
else
  echo "   ❌ Backend NÃO está rodando!"
fi

# Check frontend
if docker ps | grep -q exchange-frontend; then
  echo "   ✅ Frontend está rodando"
else
  echo "   ❌ Frontend NÃO está rodando!"
fi

echo ""
echo "========================================"
echo "✅ Pronto! Acesse: http://localhost:3000"
echo "========================================"
echo ""
echo "📋 Contas de teste (senha padrão: 123):"
echo "   user1@test.com / 123"
echo "   user2@test.com / 123"
echo "   user3@test.com / 123"
echo "   admin@trenvus.com / admin123 (se habilitado)"
echo ""
echo "🔧 Comandos úteis:"
echo "   Logs backend: docker logs -f exchange-backend"
echo "   Logs frontend: docker logs -f exchange-frontend"
echo "   Banco: docker exec -it exchange-db psql -U postgres -d exchange"
echo "   Reset total (CUIDADO): ./start-after-pull-safe.sh --reset-data"
echo ""
echo "⚠️  Se as contas de teste não funcionarem:"
echo "   1. Verifique TEST_ACCOUNT_ENABLED=true no .env"
echo "   2. Veja logs: docker logs exchange-backend | grep -i test"
echo "========================================"
