@echo off
start "NEXO Core" /min cmd /c "node "%~dp0Server\server.js""
timeout /t 1 /nobreak >nul
start "NEXO" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:4790/" --window-size=1440,940
