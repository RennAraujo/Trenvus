#!/bin/bash

# Gerar par de chaves RSA
openssl genrsa -out private.pem 2048 2>/dev/null
openssl rsa -in private.pem -pubout -out public.pem 2>/dev/null

# Converter para Base64 (uma linha)
PRIVATE_B64=$(cat private.pem | base64 -w 0)
PUBLIC_B64=$(cat public.pem | base64 -w 0)

echo "JWT_PRIVATE_KEY_B64=$PRIVATE_B64"
echo ""
echo "JWT_PUBLIC_KEY_B64=$PUBLIC_B64"

# Limpar arquivos temporários
rm -f private.pem public.pem
