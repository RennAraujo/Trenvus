#!/bin/bash
# Script CORRIGIDO para gerar chaves JWT no formato correto para Java
# O Java espera: PKCS#8 para private key, X.509 para public key (formato DER, codificado em Base64)
# Uso: ./generate-jwt-keys.sh

echo "========================================"
echo "Gerando chaves JWT para Trenvus"
echo "========================================"
echo ""

# Verificar se openssl está instalado
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL não encontrado!"
    echo "Instale o OpenSSL ou use Git Bash/WSL no Windows."
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

# Mostrar resultado
echo "✅ Chaves JWT geradas com sucesso!"
echo ""
echo "Adicione estas linhas ao seu .env:"
echo ""
echo "JWT_PRIVATE_KEY_B64=$PRIVATE_B64"
echo "JWT_PUBLIC_KEY_B64=$PUBLIC_B64"
echo ""
echo "📋 Como usar:"
echo "   1. Copie as duas linhas acima"
echo "   2. Cole no arquivo .env"
echo "   3. Execute: ./start-after-pull-safe.sh"
echo ""
echo "⚠️  IMPORTANTE: Nunca commit o arquivo .env!"
