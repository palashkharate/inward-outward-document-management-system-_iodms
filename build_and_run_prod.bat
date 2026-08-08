@echo off
REM ============================================================
REM  IODMS Unified Production Server - Build & Run Script
REM  FR-NFR: Runs frontend + backend from a single process on Port 80
REM
REM  Usage:  Double-click this file  OR  run from Command Prompt:
REM            build_and_run_prod.bat
REM
REM  Prerequisites:
REM   - Node.js (npm) installed for building the frontend
REM   - Python 3.10+ with venv already created at backend\venv
REM   - PostgreSQL running on localhost:5432 with database iodms_db
REM ============================================================

echo.
echo ============================================================
echo   HAL IODMS - Unified Production Server
echo   Building frontend and starting on Port 80...
echo ============================================================
echo.

REM Navigate to project root (where this script lives)
cd /d "%~dp0"

REM --- Step 1: Build the React frontend ---
echo [1/3] Building React frontend...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Frontend build failed! Check the errors above.
    pause
    exit /b 1
)
echo       Frontend build complete.
cd ..

REM --- Step 2: Verify backend venv exists ---
echo [2/3] Checking Python virtual environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo.
    echo ERROR: Python venv not found at backend\venv
    echo        Run these commands first:
    echo          cd backend
    echo          python -m venv venv
    echo          venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)
echo       Python venv found.

REM --- Step 3: Start the unified server on Port 80 ---
echo [3/3] Starting IODMS server on http://localhost:80 ...
echo.
echo ============================================================
echo   Server is starting...
echo   Open your browser and go to:  http://localhost
echo   Press Ctrl+C to stop the server.
echo ============================================================
echo.

cd backend
venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 80

REM If we get here, the server was stopped
echo.
echo Server stopped.
pause
