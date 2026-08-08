param(
    [string]$InstallDirectory = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
$launcherPath = Join-Path $InstallDirectory 'launch_iodms_word.ps1'

if (-not (Test-Path -LiteralPath $launcherPath)) {
    throw "IODMS Word launcher was not found: $launcherPath"
}

$protocolKey = 'HKCU:\Software\Classes\iodms-word'
New-Item -Path $protocolKey -Force | Out-Null
New-ItemProperty -Path $protocolKey -Name '(Default)' -Value 'IODMS Word Launcher' -Force | Out-Null
New-ItemProperty -Path $protocolKey -Name 'URL Protocol' -Value '' -Force | Out-Null
New-Item -Path "$protocolKey\shell\open\command" -Force | Out-Null

$command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$launcherPath`" `"%1`""
Set-ItemProperty -Path "$protocolKey\shell\open\command" -Name '(Default)' -Value $command

Write-Host 'IODMS Word Launcher installed for this Windows user.'
