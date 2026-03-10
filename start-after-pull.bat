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
echo 3. Subindo containers (com build)...
docker-compose up --build -d

echo.
echo 4. Aguardando banco de dados (10s)...
timeout /t 10 /nobreak > nul

echo.
echo 5. Aguardando backend criar contas de teste (20s)...
timeout /t 20 /nobreak > nul

echo.
echo 6. Verificando status...
docker ps | findstr exchange || echo Verifique se os containers estao rodando

echo.
echo ========================================
echo Pronto! Acesse: http://localhost:3000
echo ========================================
echo.
echo Contas de teste disponiveis:
echo    user1@test.com / 123
echo    user2@test.com / 123
echo    user3@test.com / 123
echo.
echo IMPORTANTE: Se as contas nao funcionarem:
echo    1. Verifique se TEST_ACCOUNT_ENABLED=true no .env
echo    2. Veja os logs: docker logs exchange-backend
echo    3. Aguarde mais alguns segundos e tente novamente
echo ========================================
pause
