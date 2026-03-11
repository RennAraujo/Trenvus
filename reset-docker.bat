@echo off
chcp 65001 >nul
echo 🛑 Matando containers travados...

for %%c in (exchange-db exchange-backend exchange-frontend) do (
    docker stop %%c 2>nul
    docker rm -f %%c 2>nul
)

echo 🧹 Limpando redes e volumes órfãos...
docker network prune -f >nul 2>&1

echo 🚀 Subindo tudo novamente...
docker compose up -d --build

echo.
echo ⏳ Aguardando banco ficar pronto...
:wait_loop
docker exec exchange-db pg_isready -U postgres -d exchange >nul 2>&1
if %errorlevel% neq 0 (
    echo   Aguardando PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_loop
)

echo ✅ PostgreSQL pronto!
echo.
echo 🎯 Trenvus no ar:
echo    Backend:  http://localhost:8080
echo    Frontend: http://localhost:3000
echo.
pause
