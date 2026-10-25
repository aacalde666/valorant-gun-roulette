@echo off
title [Banco de Pruebas] Valorant Gun Roulette
cd /d "%~dp0"

echo ========================================================
echo   INICIANDO BANCO DE PRUEBAS - VALORANT GUN ROULETTE
echo ========================================================
echo.
echo [1/3] Preparando entorno...

:: 1. Limpiar por si quedo algun proceso previo en el puerto 5173
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /r ":5173.*LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: 2. Arrancar el servidor Vite
echo [2/3] Levantando servidor local temporal...
start /b "" cmd /c "npm run dev -- --host --port 5173 >nul 2>&1"

:: Esperar a que el puerto 5173 este listo para aceptar conexiones
:wait_port
timeout /t 1 /nobreak >nul
netstat -ano | findstr /r ":5173.*LISTENING" >nul
if %errorlevel% neq 0 goto wait_port

echo [3/3] Abriendo ventana del Banco de Pruebas...
echo.
echo ========================================================
echo   APLICACION ABIERTA
echo   NOTA: Al cerrar la ventana con la "X", el servidor
echo   y el puerto 5173 se cerraran automaticamente.
echo ========================================================

:: 3. Lanzar la ventana en modo aplicacion y esperar (/wait) a que el usuario la cierre
set USER_PROFILE=%TEMP%\vgr_bench_profile

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start /wait "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173/ --user-data-dir="%USER_PROFILE%" --window-size=1280,850
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start /wait "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173/ --user-data-dir="%USER_PROFILE%" --window-size=1280,850
) else (
    start /wait http://localhost:5173/
)

echo.
echo ========================================================
echo   Ventana cerrada por el usuario.
echo   Apagando servidor y liberando puerto 5173...
echo ========================================================

:: 4. Matar el proceso de Node que estaba escuchando en el puerto 5173
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /r ":5173.*LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Puerto 5173 cerrado limpiamente. Cero procesos en segundo plano.
timeout /t 1 /nobreak >nul
exit
