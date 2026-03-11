@echo off
REM Script para verificar e corrigir configuracao do JWT no Windows
REM Uso: fix-jwt-keys.bat

echo ========================================
echo JWT Keys Fix Tool (Windows)
echo ========================================
echo.

REM Verificar se .env existe
if not exist .env (
  echo Arquivo .env nao encontrado!
  echo.
  echo Execute primeiro:
  echo   copy .env.example .env
  pause
  exit /b 1
)

echo 1. Verificando JWT keys no .env...
echo.

REM Verificar se as chaves estao vazias
findstr /R "^JWT_PRIVATE_KEY_B64=$" .env > nul
if %errorlevel% == 0 (
  echo Chaves JWT vazias detectadas!
  goto :generate_keys
)

findstr /R "^JWT_PUBLIC_KEY_B64=$" .env > nul
if %errorlevel% == 0 (
  echo Chaves JWT vazias detectadas!
  goto :generate_keys
)

echo JWT keys ja estao configuradas!
echo.
pause
exit /b 0

:generate_keys
echo 2. Gerando novas chaves RSA no formato correto (PKCS#8 DER)...
echo.

REM Verificar se openssl esta instalado
openssl version > nul 2>&1
if errorlevel 1 (
  echo ERRO: OpenSSL nao encontrado!
  echo.
  echo Instale o OpenSSL ou use Git Bash/WSL.
  echo.
  echo Alternativa: execute no WSL:
  echo   ./fix-jwt-keys.sh
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

REM Fazer backup do .env
copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.old > nul

REM Atualizar .env - remove linhas antigas e adiciona novas
findstr /V "JWT_PRIVATE_KEY_B64 JWT_PUBLIC_KEY_B64" .env > .env.new
echo. >> .env.new
echo # JWT Keys >> .env.new
echo JWT_PRIVATE_KEY_B64=%PRIVATE_B64% >> .env.new
echo JWT_PUBLIC_KEY_B64=%PUBLIC_B64% >> .env.new
move /Y .env.new .env > nul

echo.
echo Chaves JWT geradas e salvas no .env!
echo.
echo Proximo passo:
echo   start-after-pull-safe.bat
echo.
pause
