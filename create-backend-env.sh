#!/bin/bash
# Script para criar arquivo .env.backend com as chaves JWT
# Isso é mais confiável que passar variáveis longas via docker-compose environment
# Uso: ./create-backend-env.sh

echo "========================================"
echo "Criando arquivo de environment para backend"
echo "========================================"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "❌ .env não encontrado!"
  exit 1
fi

echo "1. Lendo chaves do .env..."

# Extrair chaves do .env
PRIVATE_KEY=$(grep "^JWT_PRIVATE_KEY_B64=" .env | cut -d'=' -f2)
PUBLIC_KEY=$(grep "^JWT_PUBLIC_KEY_B64=" .env | cut -d'=' -f2)

if [ -z "$PRIVATE_KEY" ] || [ -z "$PUBLIC_KEY" ]; then
  echo "❌ Chaves JWT não encontradas no .env!"
  echo "Execute: ./fix-jwt-keys.sh"
  exit 1
fi

echo "   ✅ Private key: ${#PRIVATE_KEY} caracteres"
echo "   ✅ Public key: ${#PUBLIC_KEY} caracteres"

echo ""
echo "2. Criando arquivo .env.backend..."

# Criar arquivo de environment específico para o backend
cat > .env.backend <> .env.backend <> .env.backend <> .env.backend <> .env.backend <> .env.backend <> .env.backend <<EOF
MERCADOPAGO_RETURN_URL=${MERCADOPAGO_RETURN_URL:-http://localhost:3000/mercadopago/return}
TEST_ACCOUNT_ENABLED=${TEST_ACCOUNT_ENABLED:-true}
TEST_ACCOUNTS=${TEST_ACCOUNTS:-user1@test.com:123:USER;user2@test.com:123:USER;user3@test.com:123:USER}
ADMIN_ACCOUNT_ENABLED=${ADMIN_ACCOUNT_ENABLED:-true}
ADMIN_LOGIN_ENABLED=${ADMIN_LOGIN_ENABLED:-true}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@trenvus.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
JAVA_OPTS=${JAVA_OPTS:--Xmx768m -Xms256m -XX:+UseContainerSupport -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Dspring.main.banner-mode=off}
SPRING_MAIN_BANNER_MODE=off
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_BOOT=INFO
LOGGING_LEVEL_TRENVUS_EXCHANGE=DEBUG
EOF

echo "   ✅ Arquivo .env.backend criado"

echo ""
echo "3. Atualizando docker-compose.yml para usar env_file..."

# Criar backup do docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

# Verificar se docker-compose.yml já tem env_file
if grep -q "env_file:" docker-compose.yml; then
  echo "   ✅ docker-compose.yml já está configurado"
else
  # Adicionar env_file ao serviço backend
  # Usar sed para inserir a linha depois de "container_name: exchange-backend"
  sed -i '/container_name: exchange-backend/a\    env_file:\n      - .env.backend' docker-compose.yml
  echo "   ✅ docker-compose.yml atualizado"
fi

echo ""
echo "========================================"
echo "✅ Configuração completa!"
echo "========================================"
echo ""
echo "Agora execute:"
echo "  docker-compose down"
echo "  docker-compose up -d"
echo ""
echo "Ou use:"
echo "  ./start-after-pull-safe.sh"
