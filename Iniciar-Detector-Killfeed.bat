@echo off
title [Consola] Detector de Killfeed Valorant (Python OCR)
cd /d "%~dp0"
echo ========================================================
echo   DETECTOR OPTICO DE KILLFEED EN TIEMPO REAL (OCR)
echo   - Monitorea la esquina superior derecha de Pantalla 2
echo   - Reconocimiento exclusivo de tu nombre: aacal666
echo   - Filtro Anti-FPS: omite la barra de FPS / Error de red
echo   - Deduplicacion de Nicks activa en temp_killfeed.json
echo   - Tu nombre a la izquierda (Killer) -> +1 Kill
echo   - Tu nombre a la derecha (Victima) -> +1 Muerte
echo   - Kills entre otros jugadores -> Ignoradas
echo ========================================================
echo.
python killfeed_detector.py
pause
