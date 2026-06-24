$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$port = if ($env:PYTHON_SERVICE_PORT) { [int]$env:PYTHON_SERVICE_PORT } else { 8000 }

if (-not (Test-Path ".\venv\Scripts\Activate.ps1")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv venv
    .\venv\Scripts\pip install -r requirements.txt
}

# Ensure OCR / Poppler tools are on PATH for this session
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$env:Path = "$machinePath;$userPath"

$tesseract = "C:\Program Files\Tesseract-OCR"
if (Test-Path $tesseract) {
    $env:Path = "$tesseract;$env:Path"
}

# If service is already healthy on this port, do not start a duplicate
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health" -TimeoutSec 2
    if ($health.status -eq 'ok') {
        Write-Host "Python PDF service is already running at http://127.0.0.1:$port"
        Write-Host "No need to start again. Backend can use PYTHON_SERVICE_URL=http://localhost:$port"
        exit 0
    }
} catch {
    # Not running yet — continue
}

$portInUse = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
if ($portInUse) {
    Write-Host ""
    Write-Host "ERROR: Port $port is already in use by another process."
    Write-Host $portInUse
    Write-Host ""
    Write-Host "Fix options:"
    Write-Host "  1) Stop the old process, then run .\start.ps1 again"
    Write-Host "  2) Or run on another port:"
    Write-Host "     `$env:PYTHON_SERVICE_PORT=8001; .\start.ps1"
    Write-Host "     (and set PYTHON_SERVICE_URL=http://localhost:8001 in backend/.env)"
    Write-Host ""
    exit 1
}

Write-Host "Starting Python PDF service on http://127.0.0.1:$port"
.\venv\Scripts\uvicorn main:app --reload --host 127.0.0.1 --port $port
