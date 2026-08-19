@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   IODMS SERVER INSTALLATION SCRIPT
echo   For Airgapped Windows Server Environments
echo ===================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please run 'Offline_Installers\python-installer.exe' first.
    echo Check the box "Add Python to PATH" during installation.
    pause
    exit /b
)

:: 2. Setup Virtual Environment
set BACKEND_DIR=%~dp0..\backend
set VENV_DIR=%BACKEND_DIR%\venv

echo [1/4] Setting up Python Virtual Environment...
if not exist "%VENV_DIR%" (
    python -m venv "%VENV_DIR%"
)

:: 3. Install Offline Packages
set WHEELS_DIR=%~dp0Offline_Installers\python_wheels
echo [2/4] Installing Python Dependencies...
if exist "%WHEELS_DIR%" (
    echo Installing from offline wheels...
    "%VENV_DIR%\Scripts\pip.exe" install --no-index --find-links="%WHEELS_DIR%" -r "%BACKEND_DIR%\requirements.txt"
) else (
    echo Offline wheels not found. Attempting online install...
    "%VENV_DIR%\Scripts\pip.exe" install -r "%BACKEND_DIR%\requirements.txt"
)

:: 4. Database Setup
echo.
echo [3/4] Database Configuration
echo Have you installed PostgreSQL using 'postgresql-installer.exe'? 
echo During installation, you should have set a password for the 'postgres' user.
echo.
set /p DB_PASS="Enter your PostgreSQL 'postgres' user password: "

:: Write to .env file
echo DATABASE_URL=postgresql+psycopg://postgres:%DB_PASS%@localhost:5432/iodms_db > "%BACKEND_DIR%\.env"
echo Created database configuration.

:: 5. Create Startup Service (Scheduled Task)
echo.
echo [4/4] Creating Background Windows Service...
set START_BAT=%BACKEND_DIR%\start_server.bat
echo @echo off > "%START_BAT%"
echo cd /d "%BACKEND_DIR%" >> "%START_BAT%"
echo call venv\Scripts\activate.bat >> "%START_BAT%"
echo uvicorn main:app --host 0.0.0.0 --port 80 >> "%START_BAT%"

schtasks /create /tn "IODMS_Server" /tr "%START_BAT%" /sc onstart /ru SYSTEM /f >nul 2>&1

echo ===================================================
echo   INSTALLATION COMPLETE!
echo ===================================================
echo The IODMS Server has been registered to start automatically when the computer turns on.
echo.
echo To start the server right now without rebooting, press any key.
pause
start /b "" "%START_BAT%"
echo Server is running! You can access it at http://localhost
pause
