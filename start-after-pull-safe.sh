#!/bin/bash
# Script seguro para reiniciar Trenvus após git pull
# PRESERVA os dados do banco - não usa -v no down
# Uso: ./start-after-pull-safe.sh [--reset-data] [--debug]

set -e

RESET_DATA=false
DEBUG_MODE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --reset-data)
      RESET_DATA=true
      shift
      ;;
    --debug)
      DEBUG_MODE=true
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
    echo ""
    echo "   Execute em outro terminal:"
    echo "   ./generate-jwt-keys.sh"
    echo "   # Cole as chaves no arquivo .env"
    echo ""
    read -p "   Pressione ENTER quando o .env estiver configurado..."
  else
    echo "   ❌ .env.example também não encontrado!"
    exit 1
  fi
else
  echo "   ✅ .env local preservado"
  
  # Verificar se JWT keys estão configuradas
  if ! grep -q "JWT_PRIVATE_KEY_B64=" .env || ! grep -q "JWT_PUBLIC_KEY_B64=" .env; then
    echo "   ⚠️  JWT keys não encontradas no .env!"
    echo ""
    echo "   Executando correção automática..."
    ./fix-jwt-keys.sh
    if [ $? -ne 0 ]; then
      echo "   ❌ Falha ao gerar JWT keys"
      exit 1
    fi
  fi
  
  # Verificar se JWT keys não estão vazias
  PRIVATE_KEY=$(grep "JWT_PRIVATE_KEY_B64=" .env | cut -d'=' -f2 | tr -d ' ')
  if [ -z "$PRIVATE_KEY" ]; then
    echo "   ⚠️  JWT_PRIVATE_KEY_B64 está vazio!"
    echo ""
    echo "   Executando correção automática..."
    ./fix-jwt-keys.sh
    if [ $? -ne 0 ]; then
      echo "   ❌ Falha ao gerar JWT keys"
      exit 1
    fi
  fi
  
  echo "   ✅ JWT keys configuradas"
fi
echo ""

echo "2. Fazendo backup do .env atual..."
BACKUP_FILE=".env.local.backup.$(date +%Y%m%d_%H%M%S)"
cp .env "$BACKUP_FILE"
echo "   ✅ Backup criado: $BACKUP_FILE"
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
echo "5. Limpando imagens antigas..."
docker image prune -f 2>/dev/null || true

echo ""
echo "6. Build e subindo containers..."
if [ "$DEBUG_MODE" = true ]; then
  echo "   Modo DEBUG: build sem cache..."
  docker-compose build --no-cache backend
else
  echo "   Build normal..."
fi

docker-compose up --build -d

echo ""
echo "7. Aguardando serviços iniciarem..."
echo ""

# Aguardar banco
DB_TIMEOUT=60
DB_WAITED=0
echo -n "   Aguardando PostgreSQL..."
while [ $DB_WAITED -lt $DB_TIMEOUT ]; do
  if docker ps | grep -q exchange-db && docker exec exchange-db pg_isready -U postgres >/dev/null 2>&1; then
    echo " ✅"
    break
  fi
  echo -n "."
  sleep 2
  DB_WAITED=$((DB_WAITED + 2))
done

if [ $DB_WAITED -ge $DB_TIMEOUT ]; then
  echo " ❌"
  echo "   ⚠️  Timeout aguardando PostgreSQL"
  echo "   Logs: docker logs exchange-db"
fi

# Aguardar backend
BACKEND_TIMEOUT=180
BACKEND_WAITED=0
echo -n "   Aguardando Backend..."
while [ $BACKEND_WAITED -lt $BACKEND_TIMEOUT ]; do
  if docker ps | grep -q exchange-backend; then
    # Verificar se healthcheck passou
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' exchange-backend 2>/dev/null || echo "starting")
    if [ "$HEALTH_STATUS" = "healthy" ]; then
      echo " ✅"
      break
    elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
      echo " ❌"
      echo "   ⚠️  Backend está unhealthy!"
      echo ""
      echo "   Logs do backend:"
      echo "   ----------------------------------------"
      docker logs --tail 50 exchange-backend
      echo "   ----------------------------------------"
      break
    fi
  fi
  
  # Verificar se container ainda existe
  if ! docker ps -a | grep -q exchange-backend; then
    echo " ❌"
    echo "   ⚠️  Container do backend foi removido!"
    break
  fi
  
  # Verificar se reiniciou muitas vezes
  RESTART_COUNT=$(docker inspect -f '{{ .RestartCount }}' exchange-backend 2>/dev/null || echo "0")
  if [ "$RESTART_COUNT" -gt 5 ]; then
    echo " ❌"
    echo "   ⚠️  Backend reiniciou $RESTART_COUNT vezes (possível loop)"
    echo ""
    echo "   Últimos logs:"
    echo "   ----------------------------------------"
    docker logs --tail 50 exchange-backend
    echo "   ----------------------------------------"
    break
  fi
  
  echo -n "."
  sleep 5
  BACKEND_WAITED=$((BACKEND_WAITED + 5))
done

if [ $BACKEND_WAITED -ge $BACKEND_TIMEOUT ]; then
  echo " ❌"
  echo "   ⚠️  Timeout aguardando Backend"
  echo "   Logs: docker logs exchange-backend --tail 100"
fi

echo ""
echo "8. Verificando status dos serviços..."
echo ""

# Check database
if docker ps | grep -q exchange-db; then
  echo "   ✅ PostgreSQL está rodando"
else
  echo "   ❌ PostgreSQL NÃO está rodando!"
fi

# Check backend
if docker ps | grep -q exchange-backend; then
  HEALTH=$(docker inspect --format='{{.State.Health.Status}}' exchange-backend 2>/dev/null || echo "unknown")
  echo "   ✅ Backend está rodando (health: $HEALTH)"
  
  # Testar endpoint
  echo -n "   Testando API..."
  if curl -s http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo " ✅"
  else
    echo " ❌"
    echo "   ⚠️  API não está respondendo ainda (pode levar mais tempo)"
  fi
else
  echo "   ❌ Backend NÃO está rodando!"
  echo "   Execute: ./diagnose.sh"
fi

# Check frontend
if docker ps | grep -q exchange-frontend; then
  echo "   ✅ Frontend está rodando"
else
  echo "   ❌ Frontend NÃO está rodando!"
fi

echo ""
echo "========================================"
echo "✅ Setup completo!"
echo "========================================"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo ""
echo "📋 Contas de teste:"
echo "   user1@test.com / 123"
echo "   user2@test.com / 123"
echo "   user3@test.com / 123"
echo "   admin@trenvus.com / admin123 (se habilitado)"
echo ""
echo "🔧 Comandos úteis:"
echo "   Logs backend:  docker logs -f exchange-backend"
echo "   Logs frontend: docker logs -f exchange-frontend"
echo "   Diagnóstico:   ./diagnose.sh"
echo "   Healthcheck:   ./healthcheck.sh"
echo "   Stats:         docker stats"
echo ""
echo "⚠️  Se as contas de teste não funcionarem:"
echo "   1. Verifique TEST_ACCOUNT_ENABLED=true no .env"
echo "   2. Veja logs: docker logs exchange-backend | grep -i test"
echo "   3. Aguarde mais alguns segundos (pode levar até 2 min)"
echo ""
echo "🐛 Para debug:"
echo "   ./start-after-pull-safe.sh --debug  (build sem cache)"
echo "   docker-compose logs -f backend      (logs em tempo real)"
echo "========================================"
