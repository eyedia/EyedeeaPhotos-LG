param(
  [string]$OutputDir = "dist-package",
  [string]$DeviceName = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Push-Location $Root
try {
  Write-Host "Installing dependencies..."
  npm install

  & "$PSScriptRoot\stage-webos.ps1" -SkipInstall

  $Stage = Join-Path $Root "dist"

  $aresPackage = Get-Command ares-package -ErrorAction SilentlyContinue
  if (-not $aresPackage) {
    Write-Warning "ares-package not found. Install webOS TV CLI (see TESTING.md)."
    Write-Host "Staged app is ready at dist/ - run 'ares-package dist' after installing CLI."
    exit 0
  }

  $PackageDir = Join-Path $Root $OutputDir
  New-Item -ItemType Directory -Force -Path $PackageDir | Out-Null

  Write-Host "Packaging IPK..."
  & ares-package -o $PackageDir $Stage

  $ipk = Get-ChildItem -Path $PackageDir -Filter "*.ipk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($ipk) {
    Write-Host "Created package: $($ipk.FullName)"
  }

  if ($DeviceName) {
    $aresInstall = Get-Command ares-install -ErrorAction SilentlyContinue
    $aresLaunch = Get-Command ares-launch -ErrorAction SilentlyContinue
    if ($aresInstall -and $ipk) {
      Write-Host "Installing to device $DeviceName..."
      & ares-install -d $DeviceName $ipk.FullName
      if ($aresLaunch) {
        & ares-launch -d $DeviceName com.eyediatech.eyedeeaphotos
      }
    }
  }
}
finally {
  Pop-Location
}
