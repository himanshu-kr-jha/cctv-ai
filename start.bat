@echo off
setlocal enabledelayedexpansion

REM ─── SentinelAI — Start Script (Windows) ─────────────────
REM Starts both backend and frontend dev servers.
REM Usage: start.bat

echo.
echo ╔══════════════════════════════════════════╗
echo ║   SentinelAI — Starting Services         ║
echo ╚══════════════════════════════════════════╝
echo.

REM ── Check if Docker containers are running ─────────────
where docker >nul 2>&1
if %errorlevel% equ 0 (
    docker ps --filter "name=cctv_ai_mongo" --format "{{.Names}}" 2>nul | findstr /i "cctv_ai_mongo" >nul
    if %errorlevel% neq 0 (
        echo [*] Starting Docker containers...
        docker compose up -d 2>nul || docker-compose up -d 2>nul
        timeout /t 2 >nul
        echo   [OK] MongoDB ^& Redis started
    ) else (
        echo   [OK] MongoDB ^& Redis already running
    )
) else (
    echo   [!] Docker not found — ensure MongoDB ^& Redis are running manually.
)
echo.

REM ── Ensure node_modules exist ───────────────────────────
if not exist backend\node_modules (
    echo [*] Installing backend dependencies...
    cd backend
    call npm install --loglevel=warn
    cd ..
)
if not exist frontend\node_modules (
    echo [*] Installing frontend dependencies...
    cd frontend
    call npm install --loglevel=warn
    cd ..
)

REM ── Start Backend ───────────────────────────────────────
echo [*] Starting backend (port 5000)...
start "SentinelAI Backend" cmd /c "cd backend && npm run dev"

REM Wait a moment for backend to initialize
timeout /t 3 >nul

REM ── Start Frontend ─────────────────────────────────────
echo [*] Starting frontend (port 5173)...
start "SentinelAI Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ╔══════════════════════════════════════════╗
echo ║   SentinelAI is running!                 ║
echo ╚══════════════════════════════════════════╝
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo.
echo   Login:     admin@cctv.ai / admin123
echo.
echo   Close the "SentinelAI Backend" and "SentinelAI Frontend"
echo   terminal windows to stop the services.
echo.

endlocal
