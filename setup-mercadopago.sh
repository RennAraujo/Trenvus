#!/bin/bash
# setup-mercadopago.sh - Configura credenciais do Mercado Pago

echo "💳 Configuração do Mercado Pago"
echo "================================"
echo ""
echo "Para obter suas credenciais:"
echo "1. Acesse: https://www.mercadopago.com.br/developers"
echo "2. Vá em 'Suas integrações' → Criar aplicação"
echo "3. Copie o Access Token e Public Key de TESTE"
echo ""

# Verifica se .env.backend existe
if [ ! -f ".env.backend" ]; then
    echo "❌ Arquivo .env.backend não encontrado!"
    echo "Criando a partir do .env.development..."
    if [ -f ".env.development" ]; then
        cp .env.development .env.backend
        echo "✅ .env.backend criado"
    else
        echo "❌ .env.development também não encontrado!"
        exit 1
    fi
fi

# Lê credenciais atuais
CURRENT_TOKEN=$(grep "MERCADOPAGO_ACCESS_TOKEN" .env.backend | cut -d'=' -f2)
CURRENT_PUBLIC_KEY=$(grep "MERCADOPAGO_PUBLIC_KEY" .env.backend | cut -d'=' -f2)

echo "Credenciais atuais:"
echo "  Access Token: ${CURRENT_TOKEN:0:20}..."
echo "  Public Key: ${CURRENT_PUBLIC_KEY:0:20}..."
echo ""

# Verifica se são placeholders
if [[ "$CURRENT_TOKEN" == *"00000000"* ]] || [ -z "$CURRENT_TOKEN" ]; then
    echo "⚠️  ATENÇÃO: As credenciais atuais são placeholders (não funcionam)"
    echo ""
fi

# Pergunta novas credenciais
read -p "Digite seu Access Token de TESTE do Mercado Pago: " NEW_TOKEN
read -p "Digite sua Public Key de TESTE do Mercado Pago: " NEW_PUBLIC_KEY

# Validação básica
if [ -z "$NEW_TOKEN" ] || [ -z "$NEW_PUBLIC_KEY" ]; then
    echo "❌ Erro: Credenciais não podem ser vazias!"
    exit 1
fi

if [[ "$NEW_TOKEN" != TEST-* ]]; then
    echo "⚠️  Aviso: O token não parece ser de TESTE (deveria começar com 'TEST-')"
    read -p "Deseja continuar mesmo assim? (s/N): " CONFIRM
    if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
        echo "Cancelado."
        exit 0
    fi
fi

# Atualiza o arquivo
echo ""
echo "📝 Atualizando .env.backend..."

# Usa sed para substituir as linhas
if grep -q "^MERCADOPAGO_ACCESS_TOKEN=" .env.backend; then
    sed -i "s|^MERCADOPAGO_ACCESS_TOKEN=.*|MERCADOPAGO_ACCESS_TOKEN=$NEW_TOKEN|" .env.backend
else
    echo "MERCADOPAGO_ACCESS_TOKEN=$NEW_TOKEN" >> .env.backend
fi

if grep -q "^MERCADOPAGO_PUBLIC_KEY=" .env.backend; then
    sed -i "s|^MERCADOPAGO_PUBLIC_KEY=.*|MERCADOPAGO_PUBLIC_KEY=$NEW_PUBLIC_KEY|" .env.backend
else
    echo "MERCADOPAGO_PUBLIC_KEY=$NEW_PUBLIC_KEY" >> .env.backend
fi

echo "✅ Credenciais atualizadas!"
echo ""
echo "🔄 Reiniciando backend para aplicar mudanças..."
docker compose restart backend

echo ""
echo "⏳ Aguardando backend iniciar..."
sleep 5

# Verifica se backend está saudável
if docker exec exchange-backend curl -fsS http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend online!"
else
    echo "⏳ Backend ainda iniciando, aguarde mais alguns segundos..."
fi

echo ""
echo "🎯 Pronto! Teste o depósito agora."
echo ""
echo "💡 Dica: Use cartões de teste do Mercado Pago:"
echo "   Visa: 5031 4332 1540 6351"
echo "   Mastercard: 5031 7557 3453 0604"
echo "   CVC: 123 | Vencimento: 11/25"
echo "   CPF: 12345678909"
