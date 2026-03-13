#!/bin/bash
# Script para configurar Mercado Pago no Trenvus

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Trenvus - Configuração Mercado Pago${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Erro: Execute este script no diretório raiz do Trenvus${NC}"
    exit 1
fi

# Verificar se .env.backend existe
if [ ! -f ".env.backend" ]; then
    echo -e "${RED}Erro: Arquivo .env.backend não encontrado!${NC}"
    echo "Crie o arquivo primeiro com base no .env.backend.example"
    exit 1
fi

echo -e "${YELLOW}Onde obter as credenciais:${NC}"
echo "1. Acesse: https://www.mercadopago.com.br/developers"
echo "2. Faça login com sua conta Mercado Pago"
echo "3. Vá em 'Suas integrações' > 'Criar aplicação'"
echo "4. Nome: Trenvus Exchange"
echo "5. Tipo: Pagamentos online"
echo "6. Depois de criar, vá em 'Credenciais'"
echo ""

echo -e "${YELLOW}Digite suas credenciais do Mercado Pago:${NC}"
echo ""

# Perguntar ambiente
echo "Qual ambiente?"
echo "1) Teste (Sandbox) - Recomendado para começar"
echo "2) Produção - Somente após testes"
read -p "Opção (1 ou 2): " AMBIENTE

if [ "$AMBIENTE" = "2" ]; then
    ENV_PREFIX="APP_USR"
    echo -e "${YELLOW}Modo PRODUÇÃO selecionado${NC}"
else
    ENV_PREFIX="TEST"
    echo -e "${GREEN}Modo TESTE selecionado${NC}"
fi

echo ""
read -p "Access Token ($ENV_PREFIX-...): " ACCESS_TOKEN
read -p "Public Key ($ENV_PREFIX-...): " PUBLIC_KEY

echo ""
echo -e "${YELLOW}URL de retorno (webhook):${NC}"
echo "Esta é a URL para onde o usuário será redirecionado após o pagamento"
echo "Exemplo: http://195.200.7.31:3000/mercadopago/return"
read -p "Return URL [http://195.200.7.31:3000/mercadopago/return]: " RETURN_URL
RETURN_URL=${RETURN_URL:-"http://195.200.7.31:3000/mercadopago/return"}

# Validar inputs
if [ -z "$ACCESS_TOKEN" ] || [ -z "$PUBLIC_KEY" ]; then
    echo -e "${RED}Erro: Access Token e Public Key são obrigatórios!${NC}"
    exit 1
fi

# Fazer backup do .env.backend
BACKUP_FILE=".env.backend.backup.$(date +%Y%m%d_%H%M%S)"
cp .env.backend "$BACKUP_FILE"
echo -e "${GREEN}Backup criado: $BACKUP_FILE${NC}"

# Atualizar ou adicionar as variáveis
update_or_add_var() {
    local var_name=$1
    local var_value=$2
    
    if grep -q "^${var_name}=" .env.backend; then
        # Substituir linha existente
        sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" .env.backend
    else
        # Adicionar nova linha
        echo "" >> .env.backend
        echo "# Mercado Pago Configuration" >> .env.backend
        echo "${var_name}=${var_value}" >> .env.backend
    fi
}

# Atualizar variáveis
update_or_add_var "MERCADOPAGO_ACCESS_TOKEN" "$ACCESS_TOKEN"
update_or_add_var "MERCADOPAGO_PUBLIC_KEY" "$PUBLIC_KEY"
update_or_add_var "MERCADOPAGO_RETURN_URL" "$RETURN_URL"

echo ""
echo -e "${GREEN}✓ Configuração salva no .env.backend${NC}"

echo ""
echo -e "${YELLOW}Deseja reiniciar os containers agora?${NC}"
read -p "Reiniciar (s/N): " REINICIAR

if [ "$REINICIAR" = "s" ] || [ "$REINICIAR" = "S" ]; then
    echo ""
    echo "Reiniciando containers..."
    docker compose down
    docker compose up -d --build
    
    echo ""
    echo "Aguardando inicialização..."
    sleep 15
    
    # Verificar se Mercado Pago foi configurado
    if docker logs exchange-backend 2>&1 | grep -q "Mercado Pago configured successfully"; then
        echo -e "${GREEN}✓ Mercado Pago configurado com sucesso!${NC}"
    else
        echo -e "${YELLOW}⚠ Verificando logs...${NC}"
        docker logs exchange-backend --tail 20
    fi
    
    echo ""
    echo -e "${GREEN}Aplicação reiniciada!${NC}"
    echo "Acesse: http://195.200.7.31:3000"
else
    echo ""
    echo -e "${YELLOW}Para aplicar as mudanças, execute:${NC}"
    echo "  docker compose down"
    echo "  docker compose up -d --build"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Configuração Concluída!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Para testar:"
echo "1. Acesse http://195.200.7.31:3000"
echo "2. Faça login com user1@test.com / 123"
echo "3. Vá em 'Depositar' > 'Mercado Pago'"
echo "4. Teste um pagamento"
echo ""
echo "Cartões de teste:"
echo "  Visa: 5031 4332 1540 6351 | CVV: 123 | Data: 11/30"
echo ""
