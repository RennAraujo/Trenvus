#!/bin/bash
# ============================================
# Trenvus - Post Pull Setup Script (Linux/Mac)
# ============================================
# Execute este script após fazer git pull para garantir
# que o ambiente de desenvolvimento funcione corretamente.
#
# Uso: ./post-pull.sh
# ============================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Trenvus - Post Pull Setup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Verifica se o .env.development existe
if [ ! -f ".env.development" ]; then
    echo -e "${RED}❌ ERRO: .env.development não encontrado!${NC}"
    echo -e "${RED}   Certifique-se de estar na raiz do projeto.${NC}"
    exit 1
fi

echo -e "${YELLOW}📄 Copiando .env.development → .env.backend...${NC}"

# Copia o arquivo
cp .env.development .env.backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Arquivo .env.backend criado com sucesso!${NC}"
else
    echo -e "${RED}❌ ERRO ao copiar arquivo!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔍 Verificando variáveis necessárias...${NC}"

# Verifica as variáveis críticas
CRITICAL_VARS=("JWT_PRIVATE_KEY_B64" "JWT_PUBLIC_KEY_B64" "SPRING_DATASOURCE_URL" "TEST_ACCOUNT_ENABLED")
ALL_OK=true

for var in "${CRITICAL_VARS[@]}"; do
    if grep -q "^${var}=" .env.backend; then
        value=$(grep "^${var}=" .env.backend | cut -d'=' -f2)
        if [ -n "$value" ]; then
            echo -e "${GREEN}   ✅ $var configurado${NC}"
        else
            echo -e "${RED}   ❌ $var vazio!${NC}"
            ALL_OK=false
        fi
    else
        echo -e "${RED}   ❌ $var não encontrado!${NC}"
        ALL_OK=false
    fi
done

echo ""

if [ "$ALL_OK" = false ]; then
    echo -e "${YELLOW}⚠️  ALGUNS PROBLEMAS FORAM DETECTADOS!${NC}"
    echo -e "${YELLOW}   Verifique o arquivo .env.development${NC}"
fi

echo -e "${YELLOW}🐳 Verificando containers...${NC}"
CONTAINERS=$(docker ps --format "{{.Names}}" 2>/dev/null | grep "exchange" || true)

if [ -n "$CONTAINERS" ]; then
    echo -e "${CYAN}   Containers Trenvus encontrados.${NC}"
    echo ""
    echo -e "${YELLOW}🔄 Deseja recriar os containers? (S/N)${NC}"
    read -r response
    
    if [ "$response" = "S" ] || [ "$response" = "s" ]; then
        echo ""
        echo -e "${YELLOW}🛑 Parando containers...${NC}"
        docker compose down
        
        echo ""
        echo -e "${YELLOW}🏗️  Subindo containers...${NC}"
        docker compose up -d --build
    else
        echo ""
        echo -e "${GREEN}✅ Setup concluído! Containers mantidos.${NC}"
    fi
else
    echo -e "${CYAN}   Nenhum container Trenvus em execução.${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Deseja subir os containers agora? (S/N)${NC}"
    read -r response
    
    if [ "$response" = "S" ] || [ "$response" = "s" ]; then
        echo ""
        echo -e "${YELLOW}🏗️  Subindo containers...${NC}"
        docker compose up -d --build
    fi
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Setup concluído!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${WHITE}📋 Acessos:${NC}"
echo -e "${WHITE}   Frontend: http://localhost:3000${NC}"
echo -e "${WHITE}   Backend:  http://localhost:8080${NC}"
echo ""
echo -e "${WHITE}👤 Contas de teste:${NC}"
echo -e "${WHITE}   user1@test.com / 123${NC}"
echo -e "${WHITE}   user2@test.com / 123${NC}"
echo -e "${WHITE}   user3@test.com / 123${NC}"
echo -e "${WHITE}   admin@trenvus.com / admin123${NC}"
echo ""
