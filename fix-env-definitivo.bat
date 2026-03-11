@echo off
REM Script definitivo para corrigir o problema do .env no Windows
REM Uso: fix-env-definitivo.bat

echo ==========================================
echo FIX DEFINITIVO - Problema do .env
echo ==========================================
echo.

REM Verificar se esta no diretorio correto
if not exist "docker-compose.envfile.yml" (
  echo ERRO: Nao encontrou docker-compose.envfile.yml
  echo    Certifique-se de estar na pasta do Trenvus
  pause
  exit /b 1
)

if not exist ".env" (
  echo ERRO: .env nao encontrado!
  echo    Execute primeiro: copy .env.example .env
  echo    E adicione suas JWT keys
  pause
  exit /b 1
)

echo Arquivos encontrados
echo.

REM Passo 1: Copiar docker-compose.envfile.yml para docker-compose.yml
echo [1/4] Configurando docker-compose.yml...
copy /Y docker-compose.envfile.yml docker-compose.yml > nul
echo     docker-compose.yml atualizado
echo.

REM Passo 2: Extrair chaves JWT do .env usando PowerShell
echo [2/4] Extraindo chaves JWT do .env...

powershell -Command "
  $envContent = Get-Content .env -Raw
  
  $privateMatch = [regex]::Match($envContent, 'JWT_PRIVATE_KEY_B64=(.+?)(?:\r?\n|$)')
  $publicMatch = [regex]::Match($envContent, 'JWT_PUBLIC_KEY_B64=(.+?)(?:\r?\n|$)')
  
  $private = if ($privateMatch.Success) { $privateMatch.Groups[1].Value.Trim() } else { '' }
  $public = if ($publicMatch.Success) { $publicMatch.Groups[1].Value.Trim() } else { '' }
  
  if (-not $private -or -not $public) {
    Write-Host '    ERRO: Chaves JWT nao encontradas no .env!' -ForegroundColor Red
    exit 1
  }
  
  Write-Host \"    Chaves encontradas:\" -ForegroundColor Green
  Write-Host \"       Private: $($private.Length) caracteres\"
  Write-Host \"       Public: $($public.Length) caracteres\"
  
  # Criar .env.backend
  $backendEnv = @\"
JWT_PRIVATE_KEY_B64=$private
JWT_PUBLIC_KEY_B64=$public
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/exchange
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_ISSUER=Trenvus
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000
APP_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8080
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNTS=user1@test.com:123:USER;user2@test.com:123:USER;user3@test.com:123:USER
ADMIN_ACCOUNT_ENABLED=true
ADMIN_LOGIN_ENABLED=true
ADMIN_EMAIL=admin@trenvus.com
ADMIN_PASSWORD=admin123
JAVA_OPTS=-Xmx768m -Xms256m -XX:+UseContainerSupport -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Dspring.main.banner-mode=off
SPRING_MAIN_BANNER_MODE=off
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_BOOT=INFO
LOGGING_LEVEL_TRENVUS_EXCHANGE=DEBUG
\"
  
  Set-Content -Path '.env.backend' -Value $backendEnv -NoNewline
  Write-Host ''
  Write-Host '    .env.backend criado' -ForegroundColor Green
"

if errorlevel 1 (
  echo.
  echo ERRO ao extrair chaves!
  pause
  exit /b 1
)

echo.

REM Passo 3: Subir containers
echo [3/4] Subindo containers...
echo     Parando containers antigos...
docker-compose down > nul 2>&1

echo     Subindo novos containers...
docker-compose up --build -d

echo.
echo ==========================================
echo FIX APLICADO!
echo ==========================================
echo.
echo Aguarde 30-60 segundos e teste:
echo.
echo   1. Ver logs: docker logs exchange-backend
echo   2. Teste login: http://localhost:3000
echo      user: user1@test.com
echo      pass: 123
echo.
echo DICA: Depois de rodar este script uma vez,
echo    o comando 'docker-compose up -d' vai funcionar normalmente.
echo ==========================================
pause
