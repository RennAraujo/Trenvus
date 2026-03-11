@echo off
REM Script para criar arquivo .env.backend com as chaves JWT no Windows
REM Isso eh mais confiavel que passar variaveis longas via docker-compose environment
REM Uso: create-backend-env.bat

echo ========================================
echo Criando arquivo de environment para backend
echo ========================================
echo.

REM Verificar se .env existe
if not exist .env (
  echo ERRO: .env nao encontrado!
  pause
  exit /b 1
)

echo 1. Lendo chaves do .env...
echo.

REM Usar PowerShell para extrair valores
powershell -Command "
  $envContent = Get-Content .env -Raw
  
  # Extrair JWT keys
  $privateMatch = [regex]::Match($envContent, 'JWT_PRIVATE_KEY_B64=(.+?)(?:\r?\n|$)')
  $publicMatch = [regex]::Match($envContent, 'JWT_PUBLIC_KEY_B64=(.+?)(?:\r?\n|$)')
  
  $private = if ($privateMatch.Success) { $privateMatch.Groups[1].Value.Trim() } else { '' }
  $public = if ($publicMatch.Success) { $publicMatch.Groups[1].Value.Trim() } else { '' }
  
  if (-not $private -or -not $public) {
    Write-Host 'ERRO: Chaves JWT nao encontradas no .env!'
    exit 1
  }
  
  Write-Host \"   Private key: $($private.Length) caracteres\"
  Write-Host \"   Public key: $($public.Length) caracteres\"
  
  # Extrair outras variaveis com defaults
  $postgresDb = if ($envContent -match 'POSTGRES_DB=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { 'exchange' }
  $postgresUser = if ($envContent -match 'POSTGRES_USER=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { 'postgres' }
  $postgresPass = if ($envContent -match 'POSTGRES_PASSWORD=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { 'postgres' }
  $jwtIssuer = if ($envContent -match 'JWT_ISSUER=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { 'Trenvus' }
  $jwtAccess = if ($envContent -match 'JWT_ACCESS_TTL_SECONDS=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { '900' }
  $jwtRefresh = if ($envContent -match 'JWT_REFRESH_TTL_SECONDS=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { '2592000' }
  $cors = if ($envContent -match 'APP_CORS_ORIGINS=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { 'http://localhost:3000,http://127.0.0.1:3000' }
  $appUrl = if ($envContent -match 'APP_BASE_URL=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { 'http://localhost:3000' }
  $apiUrl = if ($envContent -match 'API_BASE_URL=(.+?)(?:\r?\n|$)') { $Matches[1].Trim() } else { 'http://localhost:8080' }
  
  # Criar arquivo .env.backend
  $backendEnv = @"
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/$postgresDb
SPRING_DATASOURCE_USERNAME=$postgresUser
SPRING_DATASOURCE_PASSWORD=$postgresPass

# JWT Keys
JWT_PRIVATE_KEY_B64=$private
JWT_PUBLIC_KEY_B64=$public
JWT_ISSUER=$jwtIssuer
JWT_ACCESS_TTL_SECONDS=$jwtAccess
JWT_REFRESH_TTL_SECONDS=$jwtRefresh

# CORS
APP_CORS_ORIGINS=$cors

# URLs
APP_BASE_URL=$appUrl
API_BASE_URL=$apiUrl

# Outras configs
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
"@
  
  Set-Content -Path '.env.backend' -Value $backendEnv -NoNewline
  Write-Host ''
  Write-Host '   Arquivo .env.backend criado'
"

if errorlevel 1 (
  echo.
  echo ERRO ao criar arquivo!
  pause
  exit /b 1
)

echo.
echo 2. Atualizando docker-compose.yml...
echo.

REM Verificar se docker-compose.yml ja tem env_file
findstr /C:"env_file:" docker-compose.yml > nul
if errorlevel 1 (
  REM Adicionar env_file ao servico backend usando PowerShell
  powershell -Command "
    $content = Get-Content docker-compose.yml -Raw
    if ($content -notmatch 'env_file:') {
      $content = $content -replace '(backend:.*?container_name: exchange-backend)', \"`$1`n    env_file:`n      - .env.backend\"
      Set-Content -Path 'docker-compose.yml' -Value $content -NoNewline
      Write-Host '   docker-compose.yml atualizado'
    } else {
      Write-Host '   docker-compose.yml ja esta configurado'
    }
  "
) else (
  echo    docker-compose.yml ja esta configurado
)

echo.
echo ========================================
echo Configuracao completa!
echo ========================================
echo.
echo Agora execute:
echo   docker-compose down
echo   docker-compose up -d
echo.
echo Ou use:
echo   start-after-pull-safe.bat
echo.
pause
