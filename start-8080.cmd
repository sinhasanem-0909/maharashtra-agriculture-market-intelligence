@echo off
setlocal
cd /d "%~dp0"
set HOST=127.0.0.1
set PORT=8080
start "" "http://127.0.0.1:8080"
node server.js --port 8080
pause
