@echo off
start "" wscript.exe "%~dp0Server\start-hidden.vbs"
timeout /t 1 /nobreak >nul
start "NEXO" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:4790/" --window-size=1440,940
