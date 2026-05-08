@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo Stopping backend/frontend processes on common ports...
for %%P in (3000 5173 5432) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    if not "%%A"=="0" if not "%%A"=="4" (
      echo Killing PID %%A using port %%P
      taskkill /PID %%A /F >nul 2>nul
    )
  )
)

echo Trying docker compose down (if Docker is running)...
docker compose down >nul 2>nul

echo Done. You can run start.bat again.
endlocal
