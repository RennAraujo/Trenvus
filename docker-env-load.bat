@echo off
REM Script para carregar variaveis do .env no Windows
REM Uso: docker-env-load.bat

echo ========================================
echo Docker Environment Loader (Windows)
echo ========================================
echo.

REM Verificar se .env existe
if not exist .env (
  echo ERRO: .env nao encontrado!
  pause
  exit /b 1
)

echo Carregando variaveis do .env...
echo.

REM Usar PowerShell para carregar e exportar variaveis
powershell -Command "
  Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]*)=(.*)$') {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim()
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
  Write-Host 'Variaveis carregadas:'
  $private = [Environment]::GetEnvironmentVariable('JWT_PRIVATE_KEY_B64', 'Process')
  $public = [Environment]::GetEnvironmentVariable('JWT_PUBLIC_KEY_B64', 'Process')
  if ($private) {
    Write-Host \"  JWT_PRIVATE_KEY_B64: $($private.Length) caracteres\"
  } else {
    Write-Host '  ERRO: JWT_PRIVATE_KEY_B64 VAZIO'
  }
  if ($public) {
    Write-Host \"  JWT_PUBLIC_KEY_B64: $($public.Length) caracteres\"
  } else {
    Write-Host '  ERRO: JWT_PUBLIC_KEY_B64 VAZIO'
  }
"

echo.
echo Agora execute:
echo   docker-compose down
echo   docker-compose up -d
echo.
pause
