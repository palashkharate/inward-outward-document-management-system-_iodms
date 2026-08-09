@echo off
echo ========================================================
echo IODMS Offline Dependency Installer
echo ========================================================
echo.
echo Installing Python dependencies for backend...
echo This will use the locally downloaded wheels in \backend_wheels
echo.

pip install --no-index --find-links=backend_wheels -r requirements.txt

echo.
if %errorlevel% neq 0 (
    echo ========================================================
    echo ERROR: Failed to install dependencies.
    echo Please ensure Python and pip are installed and in your PATH.
    echo ========================================================
    pause
    exit /b %errorlevel%
)

echo ========================================================
echo SUCCESS: All dependencies installed successfully!
echo You can now run the IODMS application.
echo ========================================================
pause
