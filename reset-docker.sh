#!/bin/bash
# reset-docker.sh - Script para resetar containers travados

echo "🛑 Parando e removendo containers travados..."

# Pega todos os containers do projeto Trenvus
CONTAINERS=$(docker ps -aq --filter "name=exchange-" 2>/dev/null)

if [ -n "$CONTAINERS" ]; then
    echo "Removendo containers: $CONTAINERS"
    docker stop $CONTAINERS 2>/dev/null || true
    docker rm -f $CONTAINERS 2>/dev/null || true
fi

# Remove volumes órfãos (opcional - cuidado se quiser manter dados)
# docker volume prune -f

# Remove redes órfãs
docker network prune -f

echo "✅ Containers removidos. Subindo tudo novamente..."
docker compose up -d --build

echo ""
echo "⏳ Aguardando banco ficar pronto..."
sleep 5

# Verifica se o banco tá saudável
until docker exec exchange-db pg_isready -U postgres -d exchange >/dev/null 2>&1; do
    echo "  Aguardando PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL pronto!"
echo ""
echo "🚀 Trenvus está no ar:"
echo "   Backend: http://localhost:8080"
echo "   Frontend: http://localhost:3000"
