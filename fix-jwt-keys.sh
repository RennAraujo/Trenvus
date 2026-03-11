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
echo "2. Gerando novas chaves RSA no formato correto (PKCS#8 DER)..."
echo ""

# Verificar se openssl está instalado
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL não encontrado!"
    exit 1
fi

# Gerar chave privada RSA
openssl genrsa -out private.pem 2048 2>/dev/null

# Extrair chave pública
openssl rsa -in private.pem -pubout -out public.pem 2>/dev/null

# Converter chave privada para formato PKCS#8 DER e codificar em Base64
openssl pkcs8 -topk8 -inform PEM -outform DER -in private.pem -nocrypt | base64 -w 0 > private.b64

# Converter chave pública para formato X.509 DER e codificar em Base64
openssl rsa -pubin -in public.pem -outform DER | base64 -w 0 > public.b64

# Ler os valores
PRIVATE_B64=$(cat private.b64)
PUBLIC_B64=$(cat public.b64)

# Limpar arquivos temporários
rm -f private.pem public.pem private.b64 public.b64

# Fazer backup do .env
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
cp .env "$BACKUP_FILE"
echo "   ✅ Backup criado: $BACKUP_FILE"

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

echo ""
echo "✅ Chaves JWT geradas e salvas no .env!"
echo ""
echo "Próximo passo:"
echo "  ./start-after-pull-safe.sh"
