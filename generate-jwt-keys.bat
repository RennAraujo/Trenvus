@echo off
REM Script CORRIGIDO para gerar chaves JWT no formato correto para Java (Windows)
REM O Java espera: PKCS#8 para private key, X.509 para public key (formato DER, codificado em Base64)
REM Uso: generate-jwt-keys.bat

echo ========================================
echo Gerando chaves JWT para Trenvus (Windows)
echo ========================================
echo.

REM Verificar se openssl esta instalado
openssl version > nul 2>&1
if errorlevel 1 (
    echo ERRO: OpenSSL nao encontrado!
    echo.
    echo Instale o OpenSSL ou use Git Bash/WSL.
    echo.
    echo Alternativa: execute no WSL:
    echo   ./generate-jwt-keys.sh
    pause
    exit /b 1
)

REM Gerar chave privada RSA
openssl genrsa -out private.pem 2048 2> nul

REM Extrair chave publica
openssl rsa -in private.pem -pubout -out public.pem 2> nul

REM Converter chave privada para formato PKCS#8 DER e codificar em Base64
openssl pkcs8 -topk8 -inform PEM -outform DER -in private.pem -nocrypt 2> nul | openssl base64 -A > private.b64

REM Converter chave publica para formato X.509 DER e codificar em Base64
openssl rsa -pubin -in public.pem -outform DER 2> nul | openssl base64 -A > public.b64

REM Ler os valores
set /p PRIVATE_B64=<private.b64
set /p PUBLIC_B64=<public.b64

REM Limpar arquivos temporarios
del private.pem public.pem private.b64 public.b64 2> nul

echo.
echo Chaves JWT geradas com sucesso!
echo.
echo Adicione estas linhas ao seu .env:
echo.
echo JWT_PRIVATE_KEY_B64=%PRIVATE_B64%
echo JWT_PUBLIC_KEY_B64=%PUBLIC_B64%
echo.
echo Como usar:
echo    1. Copie as duas linhas acima
echo    2. Cole no arquivo .env
echo    3. Execute: start-after-pull-safe.bat
echo.
pause
