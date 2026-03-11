#!/bin/bash
# Script para corrigir o .env.backend com todas as variáveis necessárias

echo "=========================================="
echo "Corrigindo .env.backend"
echo "=========================================="
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "❌ ERRO: .env não encontrado!"
  exit 1
fi

echo "✅ .env encontrado"
echo ""

# Extrair chaves JWT do .env
PRIVATE_KEY=$(grep "^JWT_PRIVATE_KEY_B64=" .env | cut -d'=' -f2)
PUBLIC_KEY=$(grep "^JWT_PUBLIC_KEY_B64=" .env | cut -d'=' -f2)

if [ -z "$PRIVATE_KEY" ] || [ -z "$PUBLIC_KEY" ]; then
  echo "❌ ERRO: Chaves JWT não encontradas no .env!"
  exit 1
fi

echo "✅ Chaves JWT encontradas"
echo ""

# Criar .env.backend completo
echo "[1/2] Criando .env.backend com todas as variáveis..."

cat > .env.backend << 'EOF'
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/exchange
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# JWT Keys
EOF

echo "JWT_PRIVATE_KEY_B64=$PRIVATE_KEY" >> .env.backend
echo "JWT_PUBLIC_KEY_B64=$PUBLIC_KEY" >> .env.backend

cat >> .env.backend << 'EOF'

# JWT Config
JWT_ISSUER=Trenvus
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000

# CORS
APP_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# URLs
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8080

# Test Accounts
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS=user1@test.com:123:USER;user2@test.com:123:USER;user3@test.com:123:USER

# Admin
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.com
ADMIN_PASSWORD=admin123

# JVM
JAVA_OPTS=-Xmx768m -Xms256m -XX:+UseContainerSupport -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Dspring.main.banner-mode=off
SPRING_MAIN_BANNER_MODE=off
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_BOOT=INFO
LOGGING_LEVEL_TRENVUS_EXCHANGE=DEBUG
EOF

echo "    ✅ .env.backend criado com sucesso"
echo ""

# Verificar conteúdo
echo "[2/2] Verificando conteúdo..."
echo ""
echo "Variáveis de banco:"
grep "SPRING_DATASOURCE" .env.backend
echo ""
echo "Variáveis JWT:"
grep "JWT_" .env.backend | head -4

echo ""
echo "=========================================="
echo "✅ .env.backend corrigido!"
echo "=========================================="
echo ""
echo "Agora reinicie os containers:"
echo "  docker-compose restart backend"
echo ""
echo "Ou recrie tudo:"
echo "  docker-compose down"
echo "  docker-compose up -d"
