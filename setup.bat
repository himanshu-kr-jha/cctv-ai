@echo off
setlocal enabledelayedexpansion

REM ─── SentinelAI — Setup Script (Windows) ─────────────────
REM This script sets up the entire project from scratch.
REM Run once on a fresh clone: setup.bat

echo.
echo ========================================================
echo    SentinelAI - Setup
echo    Intelligent Surveillance Platform
echo ========================================================
echo.

REM ══════════════════════════════════════════════════════════
REM  1. CHECK ^& INSTALL PREREQUISITES
REM ══════════════════════════════════════════════════════════
echo [*] Checking prerequisites...
echo.

REM ── Check for winget (Windows Package Manager) ─────────
set WINGET_AVAILABLE=false
where winget >nul 2>&1
if %errorlevel% equ 0 (
    set WINGET_AVAILABLE=true
)

REM ── Check for choco (Chocolatey) ───────────────────────
set CHOCO_AVAILABLE=false
where choco >nul 2>&1
if %errorlevel% equ 0 (
    set CHOCO_AVAILABLE=true
)

REM ── Node.js ────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Node.js not found. Attempting to install...
    if "!WINGET_AVAILABLE!"=="true" (
        echo   [-] Installing Node.js via winget...
        winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    ) else if "!CHOCO_AVAILABLE!"=="true" (
        echo   [-] Installing Node.js via Chocolatey...
        choco install nodejs-lts -y
    ) else (
        echo   [-] Downloading Node.js 20 LTS installer directly...
        set "NODE_URL=https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
        set "NODE_INSTALLER=%TEMP%\node-installer.msi"
        curl -fSL -o "!NODE_INSTALLER!" "!NODE_URL!" 2>nul || (
            bitsadmin /transfer "NodeJSDownload" /priority high "!NODE_URL!" "!NODE_INSTALLER!" >nul 2>&1
        )
        if exist "!NODE_INSTALLER!" (
            echo   [-] Running Node.js installer...
            msiexec /i "!NODE_INSTALLER!" /qn /norestart
            del "!NODE_INSTALLER!" 2>nul
        ) else (
            echo   [X] Download failed. Please install Node.js 18+ manually from: https://nodejs.org/
            pause
            exit /b 1
        )
    )
    REM Refresh PATH
    call refreshenv >nul 2>&1
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    where node >nul 2>&1
    if %errorlevel% neq 0 (
        echo   [X] Node.js installation may require a terminal restart.
        echo       Please close this terminal, open a new one, and run setup.bat again.
        pause
        exit /b 1
    )
)
for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_VER=%%a
set NODE_VER=!NODE_VER:v=!
if !NODE_VER! lss 18 (
    echo   [X] Node.js 18+ required. Please upgrade.
    pause
    exit /b 1
)
for /f %%v in ('node -v') do echo   [OK] Node.js %%v

REM ── npm ────────────────────────────────────────────────
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo   [X] npm is not installed (should come with Node.js).
    pause
    exit /b 1
)
for /f %%v in ('npm -v') do echo   [OK] npm %%v

REM ── Docker ────────────────────────────────────────────
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Docker not found. Attempting to install...
    if "!WINGET_AVAILABLE!"=="true" (
        echo   [-] Installing Docker Desktop via winget...
        winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
    ) else if "!CHOCO_AVAILABLE!"=="true" (
        echo   [-] Installing Docker Desktop via Chocolatey...
        choco install docker-desktop -y
    ) else (
        echo   [-] Downloading Docker Desktop installer directly...
        set "DOCKER_URL=https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe"
        set "DOCKER_INSTALLER=%TEMP%\DockerDesktopInstaller.exe"
        curl -fSL -o "!DOCKER_INSTALLER!" "!DOCKER_URL!" 2>nul || (
            echo   [-] Trying bitsadmin download...
            bitsadmin /transfer "DockerDownload" /priority high "!DOCKER_URL!" "!DOCKER_INSTALLER!" >nul 2>&1
        )
        if exist "!DOCKER_INSTALLER!" (
            echo   [-] Running Docker Desktop installer (this may take a few minutes)...
            start /wait "" "!DOCKER_INSTALLER!" install --quiet --accept-license
            del "!DOCKER_INSTALLER!" 2>nul
        ) else (
            echo   [X] Download failed. Please install Docker Desktop manually from:
            echo       https://www.docker.com/products/docker-desktop/
            pause
            exit /b 1
        )
    )
    echo.
    echo   [!!] Docker Desktop has been installed.
    echo        Please start Docker Desktop, wait for it to finish loading,
    echo        then run setup.bat again.
    pause
    exit /b 0
)
echo   [OK] Docker found

REM ── Check Docker is running ─────────────────────────────
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Docker daemon is not running.
    echo       Please start Docker Desktop and wait for it to finish loading.
    echo       Then run setup.bat again.
    pause
    exit /b 1
)
echo   [OK] Docker daemon is running

REM ── FFmpeg (optional) ───────────────────────────────────
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] FFmpeg not found. Attempting to install...
    if "!WINGET_AVAILABLE!"=="true" (
        echo   [-] Installing FFmpeg via winget...
        winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements >nul 2>&1
        call refreshenv >nul 2>&1
    ) else if "!CHOCO_AVAILABLE!"=="true" (
        echo   [-] Installing FFmpeg via Chocolatey...
        choco install ffmpeg -y >nul 2>&1
        call refreshenv >nul 2>&1
    ) else (
        echo   [-] Downloading FFmpeg from GitHub releases...
        set "FFMPEG_ZIP=%TEMP%\ffmpeg-win64.zip"
        set "FFMPEG_DIR=C:\ffmpeg"

        REM Download latest GPL essentials build from BtbN (official GitHub mirror)
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $url = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip'; Invoke-WebRequest -Uri $url -OutFile '%TEMP%\ffmpeg-win64.zip' -UseBasicParsing" 2>nul

        if exist "!FFMPEG_ZIP!" (
            echo   [-] Extracting FFmpeg to C:\ffmpeg ...
            powershell -Command "Expand-Archive -Force '!FFMPEG_ZIP!' '%TEMP%\ffmpeg_extract'" >nul 2>&1

            REM Copy the bin contents to C:\ffmpeg
            if not exist "!FFMPEG_DIR!" mkdir "!FFMPEG_DIR!"
            for /d %%d in ("%TEMP%\ffmpeg_extract\ffmpeg-*") do (
                xcopy "%%d\bin\*.exe" "!FFMPEG_DIR!\" /Y /Q >nul 2>&1
            )

            REM Clean up download files
            del "!FFMPEG_ZIP!" 2>nul
            rmdir /s /q "%TEMP%\ffmpeg_extract" 2>nul

            REM Add C:\ffmpeg to system PATH permanently (without corrupting existing PATH)
            set "PATH=!FFMPEG_DIR!;!PATH!"
            powershell -Command "$old = [Environment]::GetEnvironmentVariable('Path','User'); if ($old -notlike '*C:\ffmpeg*') { [Environment]::SetEnvironmentVariable('Path', 'C:\ffmpeg;' + $old, 'User') }" >nul 2>&1
            echo   [OK] FFmpeg extracted to C:\ffmpeg and added to PATH
        ) else (
            echo   [!] Download failed. FFmpeg is optional - video frame capture will use placeholders.
            echo       You can install manually from: https://ffmpeg.org/download.html
        )
    )
    where ffmpeg >nul 2>&1
    if %errorlevel% equ 0 (
        echo   [OK] FFmpeg installed
    ) else (
        echo   [!] FFmpeg not installed - video frame capture will use placeholder images.
    )
) else (
    echo   [OK] FFmpeg installed
)

echo.

REM ══════════════════════════════════════════════════════════
REM  2. ENVIRONMENT FILE
REM ══════════════════════════════════════════════════════════
echo [*] Setting up environment...
if not exist .env (
    copy .env.example .env >nul
    echo   [OK] Created .env from .env.example
) else (
    echo   [OK] .env already exists
)
echo.

REM ══════════════════════════════════════════════════════════
REM  3. START MONGODB ^& REDIS VIA DOCKER
REM ══════════════════════════════════════════════════════════
echo [*] Starting MongoDB ^& Redis via Docker...
docker compose up -d 2>nul
if %errorlevel% neq 0 (
    docker-compose up -d 2>nul
)
echo   [OK] MongoDB (port 27017) and Redis (port 6379) are running
echo.

REM ══════════════════════════════════════════════════════════
REM  4. INSTALL DEPENDENCIES
REM ══════════════════════════════════════════════════════════
echo [*] Installing backend dependencies...
cd backend
call npm install --loglevel=warn
cd ..
echo   [OK] Backend dependencies installed
echo.

echo [*] Installing frontend dependencies...
cd frontend
call npm install --loglevel=warn
cd ..
echo   [OK] Frontend dependencies installed
echo.

REM ══════════════════════════════════════════════════════════
REM  5. CREATE DIRECTORIES
REM ══════════════════════════════════════════════════════════
echo [*] Creating directories...
if not exist backend\uploads\models mkdir backend\uploads\models
if not exist backend\uploads\snapshots mkdir backend\uploads\snapshots
if not exist backend\streams\samples mkdir backend\streams\samples
echo   [OK] Upload and stream directories ready
echo.

REM ══════════════════════════════════════════════════════════
REM  6. SEED DATABASE
REM ══════════════════════════════════════════════════════════
echo [*] Seeding database with demo data...
cd backend
call npm run seed
cd ..
echo.

REM ══════════════════════════════════════════════════════════
REM  DONE
REM ══════════════════════════════════════════════════════════
echo ========================================================
echo    Setup Complete!
echo ========================================================
echo.
echo   Services running via Docker:
echo     MongoDB  -^> localhost:27017
echo     Redis    -^> localhost:6379
echo.
echo   Next: Run start.bat to start the application.
echo.
echo   Demo Credentials:
echo     Admin:    admin@cctv.ai / admin123
echo     Operator: operator@cctv.ai / operator123
echo.
pause

endlocal
