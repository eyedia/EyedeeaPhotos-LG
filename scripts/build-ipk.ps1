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

  Write-Host "Generating icons..."
  npm run icons

  Write-Host "Building web app..."
  npm run build

  $Stage = Join-Path $Root "dist"
  if (-not (Test-Path $Stage)) {
    throw "Build output not found at dist/"
  }

  Write-Host "Copying webOS metadata into dist..."
  Copy-Item -Force (Join-Path $Root "appinfo.json") (Join-Path $Stage "appinfo.json")
  Copy-Item -Force (Join-Path $Root "public\icon.png") (Join-Path $Stage "icon.png")
  Copy-Item -Force (Join-Path $Root "public\largeIcon.png") (Join-Path $Stage "largeIcon.png")
  Copy-Item -Force (Join-Path $Root "public\logo.svg") (Join-Path $Stage "logo.svg")

  if (-not (Test-Path (Join-Path $Stage "webOSTVjs\webOSTV.js"))) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Stage "webOSTVjs") | Out-Null
    Copy-Item -Force (Join-Path $Root "public\webOSTVjs\webOSTV.js") (Join-Path $Stage "webOSTVjs\webOSTV.js")
  }

  $aresPackage = Get-Command ares-package -ErrorAction SilentlyContinue
  if (-not $aresPackage) {
    Write-Warning "ares-package not found. Install webOS CLI: npm install -g @webosose/ares-cli"
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
