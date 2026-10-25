@echo off
title Valorant Gun Roulette
cd /d "%~dp0"

:: Iniciar la aplicacion de escritorio y el detector de forma desacoplada
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0electron\main.js"

:: Cerrar la consola CMD inmediatamente para que no quede abierta en pantalla
exit
