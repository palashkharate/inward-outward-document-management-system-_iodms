param (
    [string]$OutputDir = ".\Offline_Installers"
)

Write-Host "============================================="
Write-Host " IODMS Offline Dependency Downloader"
Write-Host " Run this on an INTERNET-CONNECTED computer."
Write-Host "============================================="

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$PythonUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
$PostgresUrl = "https://sbp.enterprisedb.com/getfile.jsp?fileid=1258814" # Postgres 16 Windows

Write-Host "`n[1/3] Downloading Python Installer..."
$PythonDest = Join-Path $OutputDir "python-installer.exe"
if (!(Test-Path $PythonDest)) {
    Invoke-WebRequest -Uri $PythonUrl -OutFile $PythonDest
    Write-Host "Python downloaded to $PythonDest"
} else {
    Write-Host "Python installer already exists."
}

Write-Host "`n[2/3] Downloading PostgreSQL Installer (This might take a minute)..."
$PostgresDest = Join-Path $OutputDir "postgresql-installer.exe"
if (!(Test-Path $PostgresDest)) {
    Invoke-WebRequest -Uri $PostgresUrl -OutFile $PostgresDest
    Write-Host "PostgreSQL downloaded to $PostgresDest"
} else {
    Write-Host "PostgreSQL installer already exists."
}

Write-Host "`n[3/3] Downloading Python Offline Packages (Wheels)..."
$WheelsDir = Join-Path $OutputDir "python_wheels"
if (!(Test-Path $WheelsDir)) {
    New-Item -ItemType Directory -Force -Path $WheelsDir | Out-Null
}
# Use pip to download wheels without installing them
Write-Host "Downloading packages listed in backend/requirements.txt..."
pip download -r ..\backend\requirements.txt -d $WheelsDir

Write-Host "`n============================================="
Write-Host " DOWNLOAD COMPLETE!"
Write-Host " You can now copy the entire 'Offline_Installers' folder"
Write-Host " to your Airgapped Server."
Write-Host "============================================="
Pause
