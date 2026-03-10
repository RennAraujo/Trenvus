@echo off
echo ========================================
echo Reiniciando containers apos git pull
echo ========================================
echo.

echo 1. Parando containers antigos...
docker-compose down

echo.
echo 2. Removendo containers existentes (se houver)...
docker rm -f exchange-db exchange-backend exchange-frontend 2>nul

echo.
echo 3. Subindo containers novos...
docker-compose up -d

echo.
echo 4. Aguardando inicializacao...
timeout /t 15 /nobreak >nul

echo.
echo 5. Verificando status...
docker ps | findstr exchange-backend

echo.
echo ========================================
echo Pronto! Acesse: http://localhost:3000
echo ========================================
