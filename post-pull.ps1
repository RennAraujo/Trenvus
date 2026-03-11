# ============================================
# Trenvus - Post Pull Setup Script (Windows)
# ============================================
# Execute este script após fazer git pull para garantir
# que o ambiente de desenvolvimento funcione corretamente.
#
# Uso: .\post-pull.ps1
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Trenvus - Post Pull Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se o .env.development existe
if (-not (Test-Path ".env.development")) {
    Write-Host "❌ ERRO: .env.development não encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar na raiz do projeto." -ForegroundColor Red
    exit 1
}

Write-Host "📄 Copiando .env.development → .env.backend..." -ForegroundColor Yellow

# Copia o arquivo
Copy-Item -Path ".env.development" -Destination ".env.backend" -Force

if ($?) {
    Write-Host "✅ Arquivo .env.backend criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO ao copiar arquivo!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Verificando variáveis necessárias..." -ForegroundColor Yellow

# Verifica as variáveis críticas
$envContent = Get-Content ".env.backend" -Raw
$criticalVars = @(
    "JWT_PRIVATE_KEY_B64",
    "JWT_PUBLIC_KEY_B64",
    "SPRING_DATASOURCE_URL",
    "TEST_ACCOUNT_ENABLED"
)

$allOk = $true
foreach ($var in $criticalVars) {
    if ($envContent -match "$var=") {
        $value = ($envContent -match "$var=(.+)")[0] -replace "$var=", ""
        if ($value -and $value -ne "") {
            Write-Host "   ✅ $var configurado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var vazio!" -ForegroundColor Red
            $allOk = $false
        }
    } else {
        Write-Host "   ❌ $var não encontrado!" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""

if (-not $allOk) {
    Write-Host "⚠️  ALGUNS PROBLEMAS FORAM DETECTADOS!" -ForegroundColor Yellow
    Write-Host "   Verifique o arquivo .env.development" -ForegroundColor Yellow
}

Write-Host "🐳 Verificando containers..." -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}}" 2>$null

if ($containers -match "exchange") {
    Write-Host "   Containers Trenvus encontrados." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔄 Deseja recriar os containers? (S/N)" -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host ""
        Write-Host "🛑 Parando containers..." -ForegroundColor Yellow
        docker compose down
        
        Write-Host ""
        Write-Host "🏗️  Subindo containers..." -ForegroundColor Yellow
        docker compose up -d --build
    } else {
        Write-Host ""
        Write-Host "✅ Setup concluído! Containers mantidos." -ForegroundColor Green
    }
} else {
    Write-Host "   Nenhum container Trenvus em execução." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Deseja subir os containers agora? (S/N)" -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host ""
        Write-Host "🏗️  Subindo containers..." -ForegroundColor Yellow
        docker compose up -d --build
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup concluído!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Acessos:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "👤 Contas de teste:" -ForegroundColor White
Write-Host "   user1@test.com / 123" -ForegroundColor White
Write-Host "   user2@test.com / 123" -ForegroundColor White
Write-Host "   user3@test.com / 123" -ForegroundColor White
Write-Host "   admin@trenvus.com / admin123" -ForegroundColor White
Write-Host ""
