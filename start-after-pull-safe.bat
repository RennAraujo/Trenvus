@echo off
REM Script seguro para reiniciar Trenvus apos git pull no Windows
REM PRESERVA os dados do banco - nao usa -v no down
REM Uso: start-after-pull-safe.bat [--reset-data]

setlocal EnableDelayedExpansion

set RESET_DATA=false

REM Parse arguments
for %%a in (%*) do (
  if "%%a"=="--reset-data" (
    set RESET_DATA=true
  )
)

echo ========================================
echo Reiniciando Trenvus (MODO SEGURO)
echo ========================================
echo.

if "%RESET_DATA%"=="true" (
  echo AVISO: Reset de dados solicitado!
  echo Isso vai APAGAR todos os dados do banco.
  set /p confirm="Tem certeza? (sim/N): "
  if not "!confirm!"=="sim" (
    echo Cancelado.
    exit /b 1
  )
  echo.
)

echo 1. Verificando .env local...
if not exist .env (
  echo    ERRO: .env nao encontrado!
  echo.
  echo Execute primeiro:
  echo   copy .env.example .env
  echo   fix-jwt-keys.bat
  pause
  exit /b 1
)
echo    .env encontrado
echo.

echo 2. Verificando JWT keys...
echo.

REM Verificar se JWT keys estao configuradas usando PowerShell
powershell -Command "
  $private = Get-Content .env | Select-String '^JWT_PRIVATE_KEY_B64=(.+)$' | ForEach-Object { $_.Matches[0].Groups[1].Value }
  $public = Get-Content .env | Select-String '^JWT_PUBLIC_KEY_B64=(.+)$' | ForEach-Object { $_.Matches[0].Groups[1].Value }
  
  if (-not $private -or -not $public) {
    Write-Host 'JWT keys nao encontradas ou vazias!'
    exit 1
  }
  
  Write-Host \"   JWT_PRIVATE_KEY_B64: $($private.Length) caracteres\"
  Write-Host \"   JWT_PUBLIC_KEY_B64: $($public.Length) caracteres\"
"

if errorlevel 1 (
  echo.
  echo Executando correcao automatica...
  call fix-jwt-keys.bat
  if errorlevel 1 (
    echo Falha ao gerar JWT keys
    pause
    exit /b 1
  )
)

echo.
echo 3. Fazendo backup do .env...
copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.old > nul
echo    Backup criado
echo.

if "%RESET_DATA%"=="true" (
  echo 4. Parando containers e REMOVENDO VOLUMES (reset total)...
  docker-compose down -v
) else (
  echo 4. Parando containers (PRESERVANDO dados)...
  docker-compose down
)

echo.
echo 5. Removendo containers orfaos...
docker rm -f exchange-db exchange-backend exchange-frontend 2>nul || echo Containers ja removidos

echo.
echo 6. Subindo containers...
docker-compose up --build -d

echo.
echo 7. Aguardando servicos iniciarem...
echo    - Banco de dados (15s)...
timeout /t 15 /nobreak >nul

echo    - Backend (30s)...
timeout /t 30 /nobreak >nul

echo.
echo 8. Verificando status...
docker ps | findstr exchange
echo.

echo ========================================
echo Pronto! Acesse: http://localhost:3000
echo ========================================
echo.
echo Contas de teste:
echo    user1@test.com / 123
echo    user2@test.com / 123
echo    user3@test.com / 123
echo.
echo Se o backend estiver reiniciando:
echo    1. Execute: docker-jwt-debug.bat
echo    2. Ou verifique: docker logs exchange-backend
echo ========================================
pause
