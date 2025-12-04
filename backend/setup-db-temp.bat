@echo off
REM Script para configurar o banco de dados Rescene
REM Use este script para criar o banco de dados com o schema completo

cd /d "%~dp0"
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    SETUP DO BANCO DE DADOS RESCENE
echo ========================================
echo.

REM Tente diferentes senhas
for %%P in (aluno root "") do (
    if "%%P"=="" (
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS rescene;" 2>nul
    ) else (
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p%%P -e "CREATE DATABASE IF NOT EXISTS rescene;" 2>nul
    )
    if !ERRORLEVEL! equ 0 (
        echo [OK] Conectado ao MySQL
        goto IMPORT_SCHEMA
    )
)

:IMPORT_SCHEMA
echo.
echo Importando schema completo...
if "%%P"=="" (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root rescene < docs\rescenedb-fixed.sql
) else (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p%%P rescene < docs\rescenedb-fixed.sql
)

if !ERRORLEVEL! equ 0 (
    echo.
    echo ========================================
    echo SUCESSO! Banco de dados criado.
    echo ========================================
    echo.
    echo Proximo passo: npm start
    echo.
) else (
    echo.
    echo ERRO ao criar o banco de dados!
    echo Verifique a conexao com MySQL.
    echo.
)

pause
