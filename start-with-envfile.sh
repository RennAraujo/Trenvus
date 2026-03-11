#!/bin/bash
# Script para usar docker-compose com env_file (solução para Windows)
# Uso: ./start-with-envfile.sh

echo "========================================"
echo "Iniciando Trenvus com env_file"
echo "========================================"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "❌ .env não encontrado!"
  exit 1
fi

echo "1. Criando arquivo .env.backend..."

# Extrair chaves e criar arquivo
grep "^JWT_PRIVATE_KEY_B64=" .env > .env.backend
grep "^JWT_PUBLIC_KEY_B64=" .env >> .env.backend

# Adicionar outras variáveis necessárias
cat >> .env.backend <<'EOF'
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/exchange
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_ISSUER=Trenvus
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000
APP_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8080
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS=user1@test.com:123:USER;user2@test.com:123:USER;user3@test.com:123:USER
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.com
ADMIN_PASSWORD=admin123
JAVA_OPTS=-Xmx768m -Xms256m -XX:+UseContainerSupport -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Dspring.main.banner-mode=off
SPRING_MAIN_BANNER_MODE=off
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_BOOT=INFO
LOGGING_LEVEL_TRENVUS_EXCHANGE=DEBUG
EOF

echo "   ✅ .env.backend criado"
echo ""

echo "2. Parando containers..."
docker-compose -f docker-compose.envfile.yml down 2>/dev/null || docker-compose down 2>/dev/null || true

echo ""
echo "3. Iniciando com docker-compose.envfile.yml..."
docker-compose -f docker-compose.envfile.yml up --build -d

echo ""
echo "4. Aguardando..."
sleep 30

echo ""
echo "5. Verificando status..."
docker ps | grep exchange

echo ""
echo "========================================"
echo "✅ Pronto!"
echo "========================================"
echo ""
echo "Acesse: http://localhost:3000"
echo ""
echo "Se ainda houver problemas:"
echo "  docker logs exchange-backend"
