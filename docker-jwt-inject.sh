#!/bin/bash
# Script para injetar JWT keys diretamente no container (solução de emergência)
# Uso: ./docker-jwt-inject.sh

echo "========================================"
echo "Docker JWT Inject Tool (Emergência)"
echo "========================================"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "❌ .env não encontrado!"
  exit 1
fi

# Ler chaves do .env
PRIVATE_KEY=$(grep "^JWT_PRIVATE_KEY_B64=" .env | cut -d'=' -f2)
PUBLIC_KEY=$(grep "^JWT_PUBLIC_KEY_B64=" .env | cut -d'=' -f2)

if [ -z "$PRIVATE_KEY" ] || [ -z "$PUBLIC_KEY" ]; then
  echo "❌ Chaves JWT não encontradas no .env!"
  echo "Execute primeiro: ./fix-jwt-keys.sh"
  exit 1
fi

echo "Chaves encontradas no .env:"
echo "  Private: ${#PRIVATE_KEY} caracteres"
echo "  Public: ${#PUBLIC_KEY} caracteres"
echo ""

# Verificar se container está rodando
if ! docker ps | grep -q exchange-backend; then
  echo "❌ Container backend não está rodando!"
  echo "Inicie primeiro: docker-compose up -d"
  exit 1
fi

echo "Injetando chaves no container..."
echo ""

# Método 1: Usar docker exec para setar as variáveis (temporário)
echo "Método 1: Verificando variáveis atuais..."
docker exec exchange-backend sh -c 'echo "JWT_PRIVATE_KEY_B64=${JWT_PRIVATE_KEY_B64:-VAZIO}"' | head -c 100
echo ""

# Método 2: Recriar container com arquivo de env temporário
echo ""
echo "Método 2: Recriando container com variáveis corretas..."
echo ""

# Parar o container
docker-compose stop backend

# Criar arquivo .env.docker com as chaves
cat > .env.docker << EOF
JWT_PRIVATE_KEY_B64=$PRIVATE_KEY
JWT_PUBLIC_KEY_B64=$PUBLIC_KEY
EOF

echo "Arquivo .env.docker criado com as chaves"
echo ""

# Iniciar com o arquivo de env específico
docker-compose --env-file .env.docker up -d backend

# Limpar arquivo temporário
rm -f .env.docker

echo ""
echo "✅ Container reiniciado com chaves injetadas!"
echo ""
echo "Verificando..."
sleep 5

# Verificar se as chaves estão no container agora
CONTAINER_PRIVATE=$(docker exec exchange-backend printenv JWT_PRIVATE_KEY_B64 2>/dev/null | head -c 50)
if [ -n "$CONTAINER_PRIVATE" ]; then
  echo "✅ JWT_PRIVATE_KEY_B64 agora está no container: ${CONTAINER_PRIVATE}..."
else
  echo "❌ Ainda vazio. Verifique logs: docker logs exchange-backend"
fi

echo ""
echo "========================================"
