@echo off
setlocal enabledelayedexpansion

REM ─── SentinelAI — Setup Script (Windows) ─────────────────
REM This script sets up the entire project from scratch.
REM Run once on a fresh clone: setup.bat

echo.
echo ╔══════════════════════════════════════════╗
echo ║   SentinelAI — Setup                     ║
echo ║   Intelligent Surveillance Platform       ║
echo ╚══════════════════════════════════════════╝
echo.

REM ── Check prerequisites ────────────────────────────────
echo [*] Checking prerequisites...

REM Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js is not installed. Please install Node.js 18+ first.
    echo     https://nodejs.org/
    exit /b 1
)
for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_VER=%%a
set NODE_VER=%NODE_VER:v=%
if %NODE_VER% lss 18 (
    echo [X] Node.js 18+ required.
    exit /b 1
)
for /f %%v in ('node -v') do echo   [OK] Node.js %%v

REM npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] npm is not installed.
    exit /b 1
)
for /f %%v in ('npm -v') do echo   [OK] npm %%v

REM Docker (optional)
set DOCKER_AVAILABLE=false
where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Docker found
    set DOCKER_AVAILABLE=true
) else (
    echo   [!] Docker not found — you'll need to run MongoDB ^& Redis manually.
)

REM FFmpeg (optional)
where ffmpeg >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] FFmpeg installed
) else (
    echo   [!] FFmpeg not found — frame capture will use placeholder images.
)

echo.

REM ── Environment file ───────────────────────────────────
echo [*] Setting up environment...
if not exist .env (
    copy .env.example .env >nul
    echo   [OK] Created .env from .env.example
) else (
    echo   [OK] .env already exists
)
echo.

REM ── Start infrastructure (Docker) ──────────────────────
if "%DOCKER_AVAILABLE%"=="true" (
    echo [*] Starting MongoDB ^& Redis via Docker...
    docker compose up -d 2>nul || docker-compose up -d 2>nul
    echo   [OK] Docker containers started
    echo.
)

REM ── Install backend dependencies ────────────────────────
echo [*] Installing backend dependencies...
cd backend
call npm install --loglevel=warn
cd ..
echo   [OK] Backend dependencies installed
echo.

REM ── Install frontend dependencies ──────────────────────
echo [*] Installing frontend dependencies...
cd frontend
call npm install --loglevel=warn
cd ..
echo   [OK] Frontend dependencies installed
echo.

REM ── Create required directories ─────────────────────────
echo [*] Creating directories...
if not exist backend\uploads\models mkdir backend\uploads\models
if not exist backend\uploads\snapshots mkdir backend\uploads\snapshots
if not exist backend\streams\samples mkdir backend\streams\samples
echo   [OK] Upload and stream directories ready
echo.

REM ── Seed database ──────────────────────────────────────
echo [*] Seeding database with demo data...
cd backend
call npm run seed
cd ..
echo.

REM ── Done ───────────────────────────────────────────────
echo ╔══════════════════════════════════════════╗
echo ║   Setup Complete!                        ║
echo ╚══════════════════════════════════════════╝
echo.
echo   Next: Run start.bat to start the application.
echo.
echo   Demo Credentials:
echo     Admin:    admin@cctv.ai / admin123
echo     Operator: operator@cctv.ai / operator123
echo.

endlocal
