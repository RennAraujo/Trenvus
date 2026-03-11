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
echo 2. Gerando novas chaves RSA...
echo.

REM Gerar chaves com OpenSSL
openssl genrsa -out private.pem 2048 2> nul
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

openssl rsa -in private.pem -pubout -out public.pem 2> nul

echo 3. Convertendo para Base64...
echo.

REM Converter para Base64 (requires PowerShell)
powershell -Command "$private = [Convert]::ToBase64String([IO.File]::ReadAllBytes('private.pem')); $public = [Convert]::ToBase64String([IO.File]::ReadAllBytes('public.pem')); Set-Content -Path '.env.tmp' -Value \"JWT_PRIVATE_KEY_B64=$private`nJWT_PUBLIC_KEY_B64=$public\""

REM Fazer backup do .env
copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.old > nul

REM Atualizar .env
findstr /V "JWT_PRIVATE_KEY_B64 JWT_PUBLIC_KEY_B64" .env > .env.new
type .env.tmp >> .env.new
move /Y .env.new .env > nul
del .env.tmp 2> nul

REM Limpar arquivos temporarios
del private.pem public.pem 2> nul

echo.
echo Chaves JWT geradas e salvas no .env!
echo.
echo Proximo passo:
echo   start-after-pull-safe.bat
echo.
pause
