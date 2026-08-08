param([Parameter(Mandatory = $true)][string]$Uri)

$ErrorActionPreference = 'Stop'
$parsedUri = [System.Uri]$Uri
$pathValue = [System.Uri]::UnescapeDataString($parsedUri.Query.TrimStart('?').Split('=', 2)[1])

if (-not ($pathValue.StartsWith('\\') -or $pathValue -match '^[A-Za-z]:\\')) {
    throw 'Only UNC paths or local Windows drive paths are allowed by the IODMS Word Launcher.'
}
if (-not (Test-Path -LiteralPath $pathValue)) {
    throw "The IODMS shared file was not found: $pathValue"
}

# Windows uses the local Word file association to open the shared document.
Invoke-Item -LiteralPath $pathValue
