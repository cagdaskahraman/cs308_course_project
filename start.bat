@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

if not exist "%~dp0backend\.env" (
  echo backend\.env not found. Creating from backend\.env.example...
  copy /Y "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
)

echo Installing backend dependencies if needed...
pushd "%~dp0backend"
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo ERROR: backend npm install failed.
    popd
    exit /b 1
  )
)
popd

echo Installing frontend dependencies if needed...
pushd "%~dp0frontend"
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo ERROR: frontend npm install failed.
    popd
    exit /b 1
  )
)
popd

set "DB_PORT=5432"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /b /c:"DB_PORT=" "%~dp0backend\.env" 2^>nul`) do set "DB_PORT=%%b"
set "DB_PORT=%DB_PORT: =%"

echo [0/4] Checking Docker Desktop...
where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker CLI not found. Install Docker Desktop first.
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo Docker engine is not ready. Trying to start Docker Desktop...
  if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
  ) else if exist "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe" (
    start "" "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe"
  ) else (
    echo ERROR: Docker Desktop executable not found.
    echo Open Docker Desktop manually, then run start.bat again.
    exit /b 1
  )
)

set /a _dockerTry=0
:waitdocker
docker info >nul 2>nul
if not errorlevel 1 goto dockerok
set /a _dockerTry+=1
if !_dockerTry! EQU 1 echo Waiting for Docker engine to become ready...
if !_dockerTry! GTR 60 (
  echo ERROR: Docker engine did not become ready in time.
  echo Open Docker Desktop and verify it shows "Engine running", then retry.
  exit /b 1
)
ping 127.0.0.1 -n 3 >nul
goto waitdocker

:dockerok
echo [1/4] Starting PostgreSQL (docker compose)...
docker compose up -d
if errorlevel 1 (
  echo Compose failed ^(often: container name already in use / wrong host port^).
  echo Removing container cs308-postgres if present, then retrying compose...
  docker rm -f cs308-postgres 2>nul
  docker compose up -d
  if errorlevel 1 (
    echo ERROR: docker compose still failed. Start Docker Desktop and try again.
    exit /b 1
  )
)

echo [2/4] Waiting for PostgreSQL ^(port %DB_PORT% on this PC^)...
set /a _try=0
:waitdb
docker exec cs308-postgres pg_isready -U postgres -q 2>nul
if errorlevel 1 goto waitretry
powershell -NoProfile -Command "try { $t=New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1',%DB_PORT%); $t.Close(); exit 0 } catch { exit 1 }"
if not errorlevel 1 goto dbok
:waitretry
set /a _try+=1
if %_try% GTR 45 (
  echo ERROR: Database not ready on 127.0.0.1:%DB_PORT% after ~90s. Check: docker logs cs308-postgres
  exit /b 1
)
ping 127.0.0.1 -n 3 >nul
goto waitdb

:dbok
echo [3/4] Running database migrations...
pushd "%~dp0backend"
call npm run migration:run
if errorlevel 1 (
  echo ERROR: npm run migration:run failed.
  popd
  exit /b 1
)
popd

echo [4/4] Opening Backend and Frontend in new windows...
start "CS308 Backend" /D "%~dp0backend" cmd /k "npm run start"
start "CS308 Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo Backend:  http://localhost:3000   API docs: http://localhost:3000/api
echo Frontend: http://localhost:5173
echo Close the Backend/Frontend windows to stop those servers. Use "docker compose down" to stop Postgres.
endlocal
