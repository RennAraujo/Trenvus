#!/bin/bash
# Script para verificar e corrigir configuração do JWT
# Uso: ./fix-jwt-keys.sh

echo "========================================"
echo "JWT Keys Fix Tool"
echo "========================================"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "❌ Arquivo .env não encontrado!"
  echo ""
  echo "Execute primeiro:"
  echo "  cp .env.example .env"
  exit 1
fi

echo "1. Verificando JWT keys no .env..."
echo ""

# Extrair valores atuais
PRIVATE_KEY=$(grep "^JWT_PRIVATE_KEY_B64=" .env | cut -d'=' -f2 | tr -d ' ')
PUBLIC_KEY=$(grep "^JWT_PUBLIC_KEY_B64=" .env | cut -d'=' -f2 | tr -d ' ')

if [ -n "$PRIVATE_KEY" ] && [ -n "$PUBLIC_KEY" ]; then
  echo "✅ JWT keys já estão configuradas!"
  echo ""
  echo "Private key length: ${#PRIVATE_KEY} caracteres"
  echo "Public key length: ${#PUBLIC_KEY} caracteres"
  exit 0
fi

echo "⚠️  JWT keys não configuradas ou vazias!"
echo ""

# Verificar se já existem arquivos de chave
if [ -f private.pem ] && [ -f public.pem ]; then
  echo "2. Arquivos de chave PEM encontrados!"
  echo "   Gerando Base64 a partir dos arquivos existentes..."
  
  PRIVATE_B64=$(cat private.pem | base64 -w 0)
  PUBLIC_B64=$(cat public.pem | base64 -w 0)
  
  # Fazer backup do .env
  cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
  
  # Atualizar .env
  if grep -q "^JWT_PRIVATE_KEY_B64=" .env; then
    sed -i "s|^JWT_PRIVATE_KEY_B64=.*|JWT_PRIVATE_KEY_B64=$PRIVATE_B64|" .env
  else
    echo "JWT_PRIVATE_KEY_B64=$PRIVATE_B64" >> .env
  fi
  
  if grep -q "^JWT_PUBLIC_KEY_B64=" .env; then
    sed -i "s|^JWT_PUBLIC_KEY_B64=.*|JWT_PUBLIC_KEY_B64=$PUBLIC_B64|" .env
  else
    echo "JWT_PUBLIC_KEY_B64=$PUBLIC_B64" >> .env
  fi
  
  echo ""
  echo "✅ JWT keys atualizadas no .env!"
  echo ""
  echo "Você pode remover os arquivos PEM se quiser:"
  echo "  rm private.pem public.pem"
  exit 0
fi

echo "2. Gerando novas chaves RSA..."
echo ""

# Gerar chaves
openssl genrsa -out private.pem 2048 2>/dev/null
openssl rsa -in private.pem -pubout -out public.pem 2>/dev/null

# Converter para Base64
PRIVATE_B64=$(cat private.pem | base64 -w 0)
PUBLIC_B64=$(cat public.pem | base64 -w 0)

# Fazer backup do .env
cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"

# Atualizar ou adicionar as chaves no .env
if grep -q "^JWT_PRIVATE_KEY_B64=" .env; then
  sed -i "s|^JWT_PRIVATE_KEY_B64=.*|JWT_PRIVATE_KEY_B64=$PRIVATE_B64|" .env
else
  echo "" >> .env
  echo "# JWT Keys" >> .env
  echo "JWT_PRIVATE_KEY_B64=$PRIVATE_B64" >> .env
fi

if grep -q "^JWT_PUBLIC_KEY_B64=" .env; then
  sed -i "s|^JWT_PUBLIC_KEY_B64=.*|JWT_PUBLIC_KEY_B64=$PUBLIC_B64|" .env
else
  echo "JWT_PUBLIC_KEY_B64=$PUBLIC_B64" >> .env
fi

# Limpar arquivos temporários
rm -f private.pem public.pem

echo "✅ Chaves JWT geradas e salvas no .env!"
echo ""
echo "Um backup do .env anterior foi criado."
echo ""
echo "Próximo passo:"
echo "  ./start-after-pull-safe.sh"
