#!/bin/bash
# Healthcheck script for Trenvus
# Verifica se todos os serviços estão funcionando corretamente
# Uso: ./healthcheck.sh

set -e

API_URL="${API_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "========================================"
echo "Trenvus Healthcheck"
echo "========================================"
echo ""

ERRORS=0

# 1. Check Docker containers
echo "📦 Verificando containers Docker..."
if docker ps | grep -q exchange-db; then
  echo "   ✅ PostgreSQL container rodando"
else
  echo "   ❌ PostgreSQL container NÃO está rodando"
  ERRORS=$((ERRORS + 1))
fi

if docker ps | grep -q exchange-backend; then
  echo "   ✅ Backend container rodando"
else
  echo "   ❌ Backend container NÃO está rodando"
  ERRORS=$((ERRORS + 1))
fi

if docker ps | grep -q exchange-frontend; then
  echo "   ✅ Frontend container rodando"
else
  echo "   ❌ Frontend container NÃO está rodando"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# 2. Check Backend Health
echo "🔌 Verificando Backend..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/actuator/health" 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
  echo "   ✅ Backend healthcheck: OK (HTTP 200)"
  
  # Get detailed health
  HEALTH_JSON=$(curl -s "$API_URL/actuator/health" 2>/dev/null || echo "{}")
  DB_STATUS=$(echo "$HEALTH_JSON" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
  
  if [ "$DB_STATUS" = "UP" ]; then
    echo "   ✅ Database connection: OK"
  else
    echo "   ⚠️  Database connection: $DB_STATUS"
  fi
else
  echo "   ❌ Backend healthcheck: FALHOU (HTTP $HEALTH_STATUS)"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# 3. Check API Endpoints
echo "🔌 Verificando endpoints da API..."

# Auth endpoint
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/test-accounts" 2>/dev/null || echo "000")
if [ "$AUTH_STATUS" = "200" ] || [ "$AUTH_STATUS" = "401" ] || [ "$AUTH_STATUS" = "403" ]; then
  echo "   ✅ Auth endpoint: OK (HTTP $AUTH_STATUS)"
else
  echo "   ⚠️  Auth endpoint: HTTP $AUTH_STATUS"
fi

# Wallet endpoint  
WALLET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/wallet" 2>/dev/null || echo "000")
if [ "$WALLET_STATUS" = "200" ] || [ "$WALLET_STATUS" = "401" ] || [ "$WALLET_STATUS" = "403" ]; then
  echo "   ✅ Wallet endpoint: OK (HTTP $WALLET_STATUS)"
else
  echo "   ⚠️  Wallet endpoint: HTTP $WALLET_STATUS"
fi

echo ""

# 4. Check Test Accounts
echo "👤 Verificando contas de teste..."

# Try to login with test account
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"123"}' 2>/dev/null || echo "{}")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo "   ✅ Login com user1@test.com: OK"
  
  # Extract token
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  
  # Check wallet
  WALLET_RESPONSE=$(curl -s "$API_URL/wallet" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")
  
  if echo "$WALLET_RESPONSE" | grep -q "usdCents"; then
    echo "   ✅ Wallet acessível para user1"
  else
    echo "   ⚠️  Wallet não acessível para user1"
  fi
  
  # Check me
  ME_RESPONSE=$(curl -s "$API_URL/me" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")
  
  if echo "$ME_RESPONSE" | grep -q "email"; then
    echo "   ✅ /me endpoint funcional"
  else
    echo "   ⚠️  /me endpoint não respondeu corretamente"
  fi
  
elif echo "$LOGIN_RESPONSE" | grep -q "Invalid credentials"; then
  echo "   ❌ Login falhou: credenciais inválidas"
  echo "      → As contas de teste podem não estar criadas"
  ERRORS=$((ERRORS + 1))
else
  echo "   ⚠️  Login respondeu de forma inesperada"
  echo "      Resposta: $LOGIN_RESPONSE"
fi

echo ""

# 5. Check Frontend
echo "🌐 Verificando Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")

if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "   ✅ Frontend respondendo: OK"
else
  echo "   ⚠️  Frontend status: HTTP $FRONTEND_STATUS"
fi

echo ""

# Summary
echo "========================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ Todos os checks passaram!"
  echo "   Aplicação está funcionando corretamente."
  exit 0
else
  echo "❌ $ERRORS problema(s) encontrado(s)"
  echo ""
  echo "🔧 Dicas de troubleshooting:"
  echo "   1. Verifique os logs: docker logs exchange-backend"
  echo "   2. Verifique se o .env está configurado"
  echo "   3. Tente reiniciar: ./start-after-pull-safe.sh"
  echo "   4. Para reset total: ./start-after-pull-safe.sh --reset-data"
  exit 1
fi
echo "========================================"
