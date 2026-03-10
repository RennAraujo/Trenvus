@echo off
chcp 65001 > nul
echo ========================================
echo Reiniciando Trenvus (completo)
echo ========================================
echo.

echo 1. Parando containers e volumes...
docker-compose down -v

echo.
echo 2. Removendo containers orfaos (se houver)...
docker rm -f exchange-db exchange-backend exchange-frontend 2> nul || echo Containers ja removidos

echo.
echo 3. Limpando cache Docker...
docker system prune -f

echo.
echo 4. Subindo containers (com build)...
docker-compose up --build -d

echo.
echo 5. Aguardando inicializacao (20s)...
timeout /t 20 /nobreak > nul

echo.
echo 6. Verificando status...
docker ps | findstr exchange || echo Verifique se os containers estao rodando

echo.
echo ========================================
echo Pronto! Acesse: http://localhost:3000
echo ========================================
echo.
echo Contas de teste:
echo   user1@test.com / test123
echo   user2@test.com / test123
echo   user3@test.com / test123
echo ========================================
pause
