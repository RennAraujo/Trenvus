@echo off
REM Script para exportar variaveis do .env no Windows antes de usar docker-compose
REM Isso garante que o docker-compose receba as variaveis corretamente
REM Uso: export-env-and-start.bat

echo ========================================
echo Exportando variaveis do .env
echo ========================================
echo.

REM Verificar se .env existe
if not exist .env (
  echo ERRO: .env nao encontrado!
  pause
  exit /b 1
)

echo Carregando variaveis...
echo.

REM Usar PowerShell para exportar todas as variaveis do .env
for /f "delims=" %%a in ('powershell -Command "Get-Content .env | Where-Object { $_ -match '^[^#]' -and $_ -match '=' } | ForEach-Object { $parts = $_ -split '=', 2; $name = $parts[0].Trim(); $value = $parts[1].Trim(); [Environment]::SetEnvironmentVariable($name, $value, 'Process'); Write-Host \"Exportado: $name\" }"') do (
  echo %%a
)

echo.
echo Variaveis carregadas!
echo.

REM Verificar JWT keys
powershell -Command "
  $private = [Environment]::GetEnvironmentVariable('JWT_PRIVATE_KEY_B64', 'Process')
  $public = [Environment]::GetEnvironmentVariable('JWT_PUBLIC_KEY_B64', 'Process')
  if ($private) {
    Write-Host \"JWT_PRIVATE_KEY_B64: $($private.Length) caracteres\"
  } else {
    Write-Host 'ERRO: JWT_PRIVATE_KEY_B64 nao encontrado!'
  }
  if ($public) {
    Write-Host \"JWT_PUBLIC_KEY_B64: $($public.Length) caracteres\"
  } else {
    Write-Host 'ERRO: JWT_PUBLIC_KEY_B64 nao encontrado!'
  }
"

echo.
echo Iniciando Docker Compose com variaveis exportadas...
echo.

REM Parar containers existentes
docker-compose down

REM Iniciar com as variaveis exportadas
docker-compose up -d

echo.
echo Aguardando 30 segundos...
timeout /t 30 /nobreak >nul

echo.
echo Verificando status:
docker ps | findstr exchange
echo.

REM Verificar se backend tem as variaveis
echo Verificando JWT no container:
docker exec exchange-backend cmd /c "echo JWT_PRIVATE_KEY_B64=%JWT_PRIVATE_KEY_B64%" 2>nul || docker exec exchange-backend sh -c "echo JWT_PRIVATE_KEY_B64=$JWT_PRIVATE_KEY_B64"

echo.
pause
