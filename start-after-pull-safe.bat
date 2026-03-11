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
  echo    .env nao encontrado! Copiando de .env.example...
  if exist .env.example (
    copy .env.example .env
    echo    .env criado de .env.example
    echo    IMPORTANTE: Edite o .env e configure suas variaveis!
  ) else (
    echo    .env.example tambem nao encontrado!
    exit /b 1
  )
) else (
  echo    .env local preservado
)
echo.

echo 2. Fazendo backup do .env atual...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
copy .env .env.local.backup.%mydate%_%mytime%
echo    Backup criado: .env.local.backup.%mydate%_%mytime%
echo.

if "%RESET_DATA%"=="true" (
  echo 3. Parando containers e REMOVENDO VOLUMES (reset total)...
  docker-compose down -v
) else (
  echo 3. Parando containers (PRESERVANDO dados)...
  docker-compose down
)

echo.
echo 4. Removendo containers orfaos...
docker rm -f exchange-db exchange-backend exchange-frontend 2>nul || echo Containers ja removidos

echo.
echo 5. Subindo containers com build...
docker-compose up --build -d

echo.
echo 6. Aguardando servicos iniciarem...
echo    - Banco de dados (15s)...
timeout /t 15 /nobreak >nul

echo    - Backend e migracoes (20s)...
timeout /t 20 /nobreak >nul

echo.
echo 7. Verificando status...
docker ps | findstr exchange
echo.

echo ========================================
echo Pronto! Acesse: http://localhost:3000
echo ========================================
echo.
echo Contas de teste (senha padrao: 123):
echo    user1@test.com / 123
echo    user2@test.com / 123
echo    user3@test.com / 123
echo    admin@trenvus.com / admin123 (se habilitado)
echo.
echo Comandos uteis:
echo    Logs backend: docker logs -f exchange-backend
echo    Logs frontend: docker logs -f exchange-frontend
echo    Reset total (CUIDADO): start-after-pull-safe.bat --reset-data
echo ========================================
pause
