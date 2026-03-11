#!/bin/bash
# Script definitivo para corrigir o problema do .env no Windows
# Uso: ./fix-env-definitivo.sh

echo "=========================================="
echo "FIX DEFINITIVO - Problema do .env"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.envfile.yml" ]; then
  echo "❌ ERRO: Não encontrou docker-compose.envfile.yml"
  echo "   Certifique-se de estar na pasta do Trenvus"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "❌ ERRO: .env não encontrado!"
  echo "   Execute primeiro: cp .env.example .env"
  echo "   E adicione suas JWT keys"
  exit 1
fi

echo "✅ Arquivos encontrados"
echo ""

# Passo 1: Copiar docker-compose.envfile.yml para docker-compose.yml
echo "[1/4] Configurando docker-compose.yml..."
cp docker-compose.envfile.yml docker-compose.yml
echo "    ✅ docker-compose.yml atualizado"
echo ""

# Passo 2: Extrair chaves JWT do .env
echo "[2/4] Extraindo chaves JWT do .env..."
PRIVATE_KEY=$(grep "^JWT_PRIVATE_KEY_B64=" .env | cut -d'=' -f2)
PUBLIC_KEY=$(grep "^JWT_PUBLIC_KEY_B64=" .env | cut -d'=' -f2)

if [ -z "$PRIVATE_KEY" ] || [ -z "$PUBLIC_KEY" ]; then
  echo "    ❌ ERRO: Chaves JWT não encontradas no .env!"
  echo ""
  echo "    Você precisa gerar as chaves primeiro:"
  echo ""
  echo "    openssl genrsa -out private.pem 2048"
  echo "    openssl rsa -in private.pem -pubout -out public.pem"
  echo "    openssl pkcs8 -topk8 -inform PEM -outform DER -in private.pem -nocrypt | base64 -w 0"
  echo "    openssl rsa -pubin -in public.pem -outform DER | base64 -w 0"
  echo ""
  exit 1
fi

echo "    ✅ Chaves encontradas:"
echo "       Private: ${#PRIVATE_KEY} caracteres"
echo "       Public: ${#PUBLIC_KEY} caracteres"
echo ""

# Passo 3: Criar .env.backend
echo "[3/4] Criando .env.backend..."

cat > .env.backend <> .env.backend <> .env.backend <> .env.backend <> .env.backend <> .env.backend <<EOF
MERCADOPAGO_RETURN_URL=http://localhost:3000/mercadopago/return
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

echo "    ✅ .env.backend criado"
echo ""

# Passo 4: Subir containers
echo "[4/4] Subindo containers..."
echo "    Parando containers antigos..."
docker-compose down > /dev/null 2>&1

echo "    Subindo novos containers..."
docker-compose up --build -d

echo ""
echo "=========================================="
echo "✅ FIX APLICADO!"
echo "=========================================="
echo ""
echo "Aguarde 30-60 segundos e teste:"
echo ""
echo "  1. Ver logs: docker logs exchange-backend | tail -20"
echo "  2. Teste login: http://localhost:3000"
echo "     user: user1@test.com"
echo "     pass: 123"
echo ""
echo "💡 DICA: Depois de rodar este script uma vez,"
echo "   o comando 'docker-compose up -d' vai funcionar normalmente."
echo "=========================================="
