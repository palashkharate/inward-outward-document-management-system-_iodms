@echo off
TITLE IODMS - Run All Services
echo ==========================================
echo       Starting IODMS Project...
echo ==========================================

echo [1] Starting PostgreSQL Database (Docker)...
docker-compose up -d db
timeout /t 3 /nobreak > NUL

echo.
echo [2] Starting IODMS Backend (Local)...
cd backend
start cmd /k "venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
cd ..

echo.
echo [3] Starting IODMS Frontend (Local)...
cd frontend
start cmd /k "npm run dev"
cd ..

echo.
echo ==========================================
echo All services are starting in new windows!
echo - Backend API Docs: http://localhost:8000/docs
echo - Frontend Website: http://localhost:3000
echo ==========================================
pause
