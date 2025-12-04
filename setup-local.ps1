# Script para setup local do projeto Rescene
# Este script configura o banco de dados MySQL e inicia o servidor

Write-Host "================================" -ForegroundColor Green
Write-Host "Setup Local - Rescene Project" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Verificar se MySQL está instalado
Write-Host "1. Verificando MySQL..." -ForegroundColor Cyan
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysqlPath)) {
    $mysqlPath = "mysql.exe"  # Tentar usar do PATH
}

# Criar banco de dados
Write-Host "2. Criando banco de dados rescene..." -ForegroundColor Cyan
try {
    $sqlFile = ".\backend\docs\rescenedb-fixed.sql"
    & $mysqlPath -u root -proot -e "CREATE DATABASE IF NOT EXISTS rescene;" 2>$null
    & $mysqlPath -u root -proot rescene < $sqlFile
    Write-Host "   ✓ Banco de dados criado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erro ao criar banco de dados" -ForegroundColor Red
    Write-Host "   Certifique-se de que o MySQL está rodando" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Iniciando servers..." -ForegroundColor Cyan
Write-Host ""

# Iniciar backend
Write-Host "   Iniciando Backend (porta 3001)..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Set-Location ..

Start-Sleep -Seconds 2

# Iniciar frontend
Write-Host "   Iniciando Frontend (porta 3000)..." -ForegroundColor Yellow
Set-Location frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Set-Location ..

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Setup concluído!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
