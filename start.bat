@echo off
TITLE RAALE - Safe Historical Replay Platform Launcher
echo ========================================================
echo RAALE - Safe Historical Replay Platform Launcher
echo Location: D:\Users\welcome\Documents\Raale project
echo ========================================================
echo.

cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
    echo [.venv] Creating Python virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo [PIP] Installing backend dependencies...
    python -m pip install -r requirements.txt
) else (
    echo [.venv] Virtual environment found.
    call .venv\Scripts\activate.bat
)

echo.
echo [BACKEND] Starting FastAPI Uvicorn backend server on http://127.0.0.1:8000 ...
echo [DOCS] Swagger API Documentation available at http://127.0.0.1:8000/docs
echo.
python run.py

pause
