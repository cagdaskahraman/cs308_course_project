@echo off
setlocal EnableExtensions
title Clear dev ports (backend / frontend)

rem Default: 3000 = Nest API (backend\src\main.ts, PORT env)
rem         5173 = Vite dev server (frontend\vite.config.ts)
rem Optional: set BACKEND_PORT=3001  set FRONTEND_PORT=5174  before running this bat

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0clear-dev-ports.ps1"

endlocal
exit /b 0
