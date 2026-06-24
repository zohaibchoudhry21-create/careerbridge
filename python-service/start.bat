@echo off
cd /d "%~dp0"

set PORT=8000
if not "%PYTHON_SERVICE_PORT%"=="" set PORT=%PYTHON_SERVICE_PORT%

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $h = Invoke-RestMethod -Uri 'http://127.0.0.1:%PORT%/health' -TimeoutSec 2; if ($h.status -eq 'ok') { Write-Host 'Python PDF service is already running at http://127.0.0.1:%PORT%'; exit 0 } } catch {}"

call venv\Scripts\activate.bat
echo Starting Python PDF service on http://127.0.0.1:%PORT%
uvicorn main:app --reload --host 127.0.0.1 --port %PORT%
