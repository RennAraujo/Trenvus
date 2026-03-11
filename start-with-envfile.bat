@echo off
REM Script para usar docker-compose com env_file no Windows
REM Uso: start-with-envfile.bat

echo ========================================
echo Iniciando Trenvus com env_file
echo ========================================
echo.

REM Verificar se .env existe
if not exist .env (
  echo ERRO: .env nao encontrado!
  pause
  exit /b 1
)

echo 1. Criando arquivo .env.backend...
echo.

REM Extrair chaves usando PowerShell
powershell -Command "
  $private = Get-Content .env | Select-String '^JWT_PRIVATE_KEY_B64=(.+)$' | ForEach-Object { $_.Matches[0].Groups[1].Value }
  $public = Get-Content .env | Select-String '^JWT_PUBLIC_KEY_B64=(.+)$' | ForEach-Object { $_.Matches[0].Groups[1].Value }
  
  @"
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
"@ | Set-Content .env.backend
"

echo    .env.backend criado
echo.

echo 2. Parando containers...
docker-compose -f docker-compose.envfile.yml down 2>nul || docker-compose down 2>nul
echo.

echo 3. Iniciando com docker-compose.envfile.yml...
docker-compose -f docker-compose.envfile.yml up --build -d
echo.

echo 4. Aguardando 30 segundos...
timeout /t 30 /nobreak >nul
echo.

echo 5. Verificando status...
docker ps | findstr exchange
echo.

echo ========================================
echo Pronto!
echo ========================================
echo.
echo Acesse: http://localhost:3000
echo.
echo Se ainda houver problemas:
echo   docker logs exchange-backend
echo.
pause
