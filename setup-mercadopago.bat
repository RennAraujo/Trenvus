@echo off
chcp 65001 >nul
echo 💳 Configuracao do Mercado Pago
echo ================================
echo.
echo Para obter suas credenciais:
echo 1. Acesse: https://www.mercadopago.com.br/developers
echo 2. Va em 'Suas integracoes' - Criar aplicacao
echo 3. Copie o Access Token e Public Key de TESTE
echo.

REM Verifica se .env.backend existe
if not exist ".env.backend" (
    echo ❌ Arquivo .env.backend nao encontrado!
    echo Criando a partir do .env.development...
    if exist ".env.development" (
        copy .env.development .env.backend >nul
        echo ✅ .env.backend criado
    ) else (
        echo ❌ .env.development tambem nao encontrado!
        pause
        exit /b 1
    )
)

REM Mostra credenciais atuais
for /f "tokens=2 delims==" %%a in ('findstr /B "MERCADOPAGO_ACCESS_TOKEN=" .env.backend') do set CURRENT_TOKEN=%%a
for /f "tokens=2 delims==" %%a in ('findstr /B "MERCADOPAGO_PUBLIC_KEY=" .env.backend') do set CURRENT_PUBLIC_KEY=%%a

echo Credenciais atuais:
echo   Access Token: %CURRENT_TOKEN:~0,20%...
echo   Public Key: %CURRENT_PUBLIC_KEY:~0,20%...
echo.

REM Verifica se sao placeholders
echo %CURRENT_TOKEN% | findstr "00000000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  ATENCAO: As credenciais atuais sao placeholders (nao funcionam)
    echo.
)

set /p NEW_TOKEN="Digite seu Access Token de TESTE do Mercado Pago: "
set /p NEW_PUBLIC_KEY="Digite sua Public Key de TESTE do Mercado Pago: "

REM Validacao basica
if "%NEW_TOKEN%"=="" (
    echo ❌ Erro: Access Token nao pode ser vazio!
    pause
    exit /b 1
)

if "%NEW_PUBLIC_KEY%"=="" (
    echo ❌ Erro: Public Key nao pode ser vazia!
    pause
    exit /b 1
)

echo %NEW_TOKEN% | findstr "^TEST-" >nul
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Aviso: O token nao parece ser de TESTE (deveria comecar com 'TEST-')
    set /p CONFIRM="Deseja continuar mesmo assim? (s/N): "
    if /i not "%CONFIRM%"=="s" (
        echo Cancelado.
        pause
        exit /b 0
    )
)

echo.
echo 📝 Atualizando .env.backend...

REM Cria arquivo temporario e substitui
set TEMP_FILE=.env.backend.tmp
echo # ============================================
echo # Trenvus - BACKEND Environment for Docker
echo # ============================================
echo.
(
    for /f "usebackq tokens=*" %%a in (".env.backend") do (
        set line=%%a
        setlocal enabledelayedexpansion
        if "!line:~0,26!=="=="MERCADOPAGO_ACCESS_TOKEN" (
            echo MERCADOPAGO_ACCESS_TOKEN=%NEW_TOKEN%
        ) else if "!line:~0,24!=="=="MERCADOPAGO_PUBLIC_KEY" (
            echo MERCADOPAGO_PUBLIC_KEY=%NEW_PUBLIC_KEY%
        ) else (
            echo !line!
        )
        endlocal
    )
) > %TEMP_FILE%

move /y %TEMP_FILE% .env.backend >nul

echo ✅ Credenciais atualizadas!
echo.
echo 🔄 Reiniciando backend para aplicar mudancas...
docker compose restart backend

echo.
echo ⏳ Aguardando backend iniciar...
timeout /t 5 /nobreak >nul

echo.
echo 🎯 Pronto! Teste o deposito agora.
echo.
echo 💡 Dica: Use cartoes de teste do Mercado Pago:
echo    Visa: 5031 4332 1540 6351
echo    Mastercard: 5031 7557 3453 0604
echo    CVC: 123 ^| Vencimento: 11/25
echo    CPF: 12345678909
echo.
pause
