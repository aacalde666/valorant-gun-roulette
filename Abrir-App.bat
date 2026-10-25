@echo off
title Valorant Gun Roulette
cd /d "%~dp0"

echo ===================================================
echo     INICIANDO VALORANT GUN ROULETTE (DESKTOP)
echo ===================================================
echo.

:: Verificar si el servidor ya esta corriendo
netstat -ano | findstr :5173 >nul
if %errorlevel% neq 0 (
    echo Iniciando servidor en segundo plano...
    start /b npm run dev -- --host --port 5173 >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: Abrir en Modo Aplicacion de Escritorio (Ventana dedicada sin barras de navegador)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173/ --window-size=1280,850
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173/ --window-size=1280,850
) else (
    start http://localhost:5173/
)

exit
