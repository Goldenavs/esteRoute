@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        esteRoute Prototype Local Launcher
echo              Local Fallback Environment
echo ========================================================
echo.

:: 1. Verify Backend Environment File
if not exist "%~dp0backend\.env" (
    echo [ERROR] backend\.env not found!
    echo Please make sure backend\.env is configured with your Supabase credentials.
    pause
    exit /b 1
)

:: 2. Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

:: 3. Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

:: 4. Locate Python Executable (prefer backend venv)
set PYTHON_EXE=python
if exist "%~dp0backend\venv\Scripts\python.exe" (
    set PYTHON_EXE="%~dp0backend\venv\Scripts\python.exe"
    echo [INFO] Found backend virtual environment.
) else (
    echo [INFO] Using system Python.
)

echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "esteRoute Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && !PYTHON_EXE! -m uvicorn main:app --reload --port 8000"

echo.
echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "esteRoute Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Waiting 3 seconds for local servers to initialize...
timeout /t 3 >nul

echo Opening local browser...
start http://localhost:5173

echo.
echo ========================================================
echo esteRoute local services are running!
echo.
echo   - Local Web UI:          http://localhost:5173
echo   - Interactive API Docs:  http://localhost:8000/docs
echo   - Health Check:          http://localhost:8000/api/health
echo ========================================================
echo.
echo Note: Keep this window open. Press any key to stop all local processes...
pause >nul

:: Terminate launched background windows cleanly
taskkill /FI "WINDOWTITLE eq esteRoute Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq esteRoute Frontend*" /F >nul 2>&1
echo Local services stopped.

