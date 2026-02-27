#!/bin/bash

# Gerar par de chaves RSA
openssl genrsa -out private.pem 2048 2>/dev/null
openssl rsa -in private.pem -pubout -out public.pem 2>/dev/null

# Extrair apenas o conteúdo DER (sem cabeçalhos PEM) e converter para base64
# O formato correto é: base64 da chave em formato DER (binário)

# Converter chave privada PEM para DER, depois para base64
openssl pkcs8 -topk8 -inform PEM -outform DER -in private.pem -nocrypt -out private.der 2>/dev/null
PRIVATE_B64=$(cat private.der | base64 -w 0)

# Converter chave pública PEM para DER, depois para base64
openssl rsa -in private.pem -pubout -outform DER -out public.der 2>/dev/null
PUBLIC_B64=$(cat public.der | base64 -w 0)

echo "JWT_PRIVATE_KEY_B64=$PRIVATE_B64"
echo ""
echo "JWT_PUBLIC_KEY_B64=$PUBLIC_B64"

# Limpar arquivos temporários
rm -f private.pem public.pem private.der public.der
