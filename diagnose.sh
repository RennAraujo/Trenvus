#!/bin/bash
# Diagnose script para Trenvus - Detecta e corrige problemas comuns
# Uso: ./diagnose.sh

set -e

echo "========================================"
echo "Trenvus Diagnostic Tool"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

ERRORS=0
WARNINGS=0

# Função para imprimir resultado
print_ok() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
  ((ERRORS++))
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

# 1. Verificar Docker
echo "1. Verificando Docker..."
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    print_ok "Docker está rodando"
  else
    print_error "Docker não está acessível (sem permissão ou não iniciado)"
    exit 1
  fi
else
  print_error "Docker não está instalado"
  exit 1
fi
echo ""

# 2. Verificar containers
echo "2. Verificando containers..."
DB_RUNNING=$(docker ps -q -f name=exchange-db 2>/dev/null | wc -l)
BACKEND_RUNNING=$(docker ps -q -f name=exchange-backend 2>/dev/null | wc -l)
FRONTEND_RUNNING=$(docker ps -q -f name=exchange-frontend 2>/dev/null | wc -l)

if [ "$DB_RUNNING" -eq 1 ]; then
  print_ok "PostgreSQL container está rodando"
else
  DB_EXISTS=$(docker ps -aq -f name=exchange-db 2>/dev/null | wc -l)
  if [ "$DB_EXISTS" -eq 1 ]; then
    print_warning "PostgreSQL container existe mas está parado"
    echo "   Logs recentes:"
    docker logs --tail 5 exchange-db 2>/dev/null || echo "   (sem logs disponíveis)"
  else
    print_error "PostgreSQL container não existe"
  fi
fi

if [ "$BACKEND_RUNNING" -eq 1 ]; then
  print_ok "Backend container está rodando"
  
  # Verificar se está em loop de restart
  RESTART_COUNT=$(docker inspect -f '{{ .RestartCount }}' exchange-backend 2>/dev/null || echo "0")
  if [ "$RESTART_COUNT" -gt 3 ]; then
    print_warning "Backend reiniciou $RESTART_COUNT vezes (possível loop)"
    echo "   Últimos logs:"
    docker logs --tail 20 exchange-backend 2>/dev/null | tail -20 || echo "   (sem logs)"
  fi
else
  BACKEND_EXISTS=$(docker ps -aq -f name=exchange-backend 2>/dev/null | wc -l)
  if [ "$BACKEND_EXISTS" -eq 1 ]; then
    print_error "Backend container existe mas está parado"
    echo ""
    echo "   Últimos logs do backend:"
    echo "   ----------------------------------------"
    docker logs --tail 30 exchange-backend 2>/dev/null || echo "   (sem logs disponíveis)"
    echo "   ----------------------------------------"
    echo ""
    
    # Verificar exit code
    EXIT_CODE=$(docker inspect -f '{{ .State.ExitCode }}' exchange-backend 2>/dev/null || echo "unknown")
    echo "   Exit code: $EXIT_CODE"
    
    if [ "$EXIT_CODE" = "1" ]; then
      echo "   → Exit code 1 geralmente indica erro de aplicação"
    elif [ "$EXIT_CODE" = "137" ]; then
      echo "   → Exit code 137 = OOM (out of memory). Aumente a memória do container"
    elif [ "$EXIT_CODE" = "143" ]; then
      echo "   → Exit code 143 = SIGTERM (encerrado normalmente)"
    fi
  else
    print_error "Backend container não existe"
  fi
fi

if [ "$FRONTEND_RUNNING" -eq 1 ]; then
  print_ok "Frontend container está rodando"
else
  FRONTEND_EXISTS=$(docker ps -aq -f name=exchange-frontend 2>/dev/null | wc -l)
  if [ "$FRONTEND_EXISTS" -eq 1 ]; then
    print_warning "Frontend container existe mas está parado"
  else
    print_error "Frontend container não existe"
  fi
fi
echo ""

# 3. Verificar .env
echo "3. Verificando arquivo .env..."
if [ -f .env ]; then
  print_ok ".env existe"
  
  # Verificar JWT keys
  if grep -q "JWT_PRIVATE_KEY_B64=" .env && grep -q "JWT_PUBLIC_KEY_B64=" .env; then
    PRIVATE_KEY=$(grep "JWT_PRIVATE_KEY_B64=" .env | cut -d'=' -f2)
    PUBLIC_KEY=$(grep "JWT_PUBLIC_KEY_B64=" .env | cut -d'=' -f2)
    
    if [ -n "$PRIVATE_KEY" ] && [ -n "$PUBLIC_KEY" ]; then
      print_ok "JWT keys configuradas"
    else
      print_error "JWT keys estão vazias no .env"
      echo "   Execute: ./generate-jwt-keys.sh"
    fi
  else
    print_error "JWT_PRIVATE_KEY_B64 ou JWT_PUBLIC_KEY_B64 não encontradas"
  fi
  
  # Verificar DB password
  if grep -q "POSTGRES_PASSWORD=" .env; then
    print_ok "POSTGRES_PASSWORD configurado"
  else
    print_warning "POSTGRES_PASSWORD não configurado (usando default)"
  fi
else
  print_error ".env não encontrado!"
  echo "   Execute: cp .env.example .env"
  echo "   E configure as variáveis necessárias"
fi
echo ""

# 4. Verificar conectividade
echo "4. Verificando conectividade..."

# Testar backend
if [ "$BACKEND_RUNNING" -eq 1 ]; then
  echo -n "   Testando backend health endpoint... "
  if curl -s "$API_URL/actuator/health" >/dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
    
    # Verificar detalhes
    HEALTH_JSON=$(curl -s "$API_URL/actuator/health" 2>/dev/null)
    DB_STATUS=$(echo "$HEALTH_JSON" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
    
    if [ "$DB_STATUS" = "UP" ]; then
      print_ok "Database connection: OK"
    else
      print_warning "Database connection: $DB_STATUS"
    fi
  else
    echo -e "${RED}FALHOU${NC}"
    print_error "Backend não está respondendo em $API_URL"
    
    # Verificar se a porta está mapeada
    PORT_MAPPED=$(docker port exchange-backend 2>/dev/null | grep 8080 | wc -l)
    if [ "$PORT_MAPPED" -eq 0 ]; then
      print_warning "Porta 8080 não parece estar mapeada"
    fi
  fi
else
  print_warning "Backend não está rodando, pulando testes de conectividade"
fi
echo ""

# 5. Verificar logs de erro comuns
echo "5. Verificando logs por erros comuns..."
if [ "$BACKEND_RUNNING" -eq 1 ] || [ "$BACKEND_EXISTS" -eq 1 ]; then
  # Procurar erros comuns nos logs
  if docker logs exchange-backend 2>&1 | grep -qi "OutOfMemoryError"; then
    print_error "Erro de memória (OOM) detectado nos logs!"
    echo "   Solução: Aumente a memória do backend no docker-compose.yml"
    echo "   Atual: deploy.resources.limits.memory: 1G"
    echo "   Sugerido: 1.5G ou 2G"
  fi
  
  if docker logs exchange-backend 2>&1 | grep -qi "Failed to start"; then
    print_error "Erro de startup detectado nos logs!"
    echo "   Execute: docker logs exchange-backend | tail -50"
  fi
  
  if docker logs exchange-backend 2>&1 | grep -qi "Connection refused"; then
    print_error "Erro de conexão com banco detectado!"
    echo "   Verifique se o PostgreSQL está rodando"
    echo "   Verifique as credenciais no .env"
  fi
fi
echo ""

# 6. Sumário
echo "========================================"
echo "Resumo do Diagnóstico"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  print_ok "Todos os checks passaram!"
  echo ""
  echo "Aplicação parece estar funcionando corretamente."
  echo "Acesse: http://localhost:3000"
elif [ $ERRORS -eq 0 ]; then
  print_warning "$WARNINGS aviso(s) encontrado(s)"
  echo ""
  echo "A aplicação pode estar funcionando, mas há itens para revisar."
else
  print_error "$ERRORS erro(s) e $WARNINGS aviso(s) encontrado(s)"
  echo ""
  echo "Ações recomendadas:"
  echo ""
  
  if [ -f .env ]; then
    if ! grep -q "JWT_PRIVATE_KEY_B64=" .env || ! grep -q "JWT_PUBLIC_KEY_B64=" .env; then
      echo "1. Gerar JWT keys:"
      echo "   ./generate-jwt-keys.sh"
      echo ""
    fi
  else
    echo "1. Criar arquivo .env:"
    echo "   cp .env.example .env"
    echo "   ./generate-jwt-keys.sh"
    echo ""
  fi
  
  if [ "$BACKEND_EXISTS" -eq 1 ] && [ "$BACKEND_RUNNING" -eq 0 ]; then
    echo "2. Ver logs do backend:"
    echo "   docker logs exchange-backend --tail 100"
    echo ""
    echo "3. Tentar recriar containers:"
    echo "   docker-compose down"
    echo "   docker-compose up --build -d"
    echo ""
  fi
  
  if [ "$DB_RUNNING" -eq 0 ]; then
    echo "4. Iniciar banco de dados:"
    echo "   docker-compose up -d db"
    echo ""
  fi
fi

echo ""
echo "Comandos úteis:"
echo "  ./start-after-pull-safe.sh    - Reiniciar tudo (preserva dados)"
echo "  ./healthcheck.sh              - Verificar saúde da aplicação"
echo "  docker logs -f exchange-backend - Ver logs em tempo real"
echo "  docker stats                  - Ver uso de recursos"
echo "========================================"
