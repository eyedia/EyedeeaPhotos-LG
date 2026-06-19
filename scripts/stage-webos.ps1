param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Push-Location $Root
try {
  if (-not $SkipInstall) {
    Write-Host "Installing dependencies..."
    npm install
  }

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

  Write-Host "Staged webOS app at dist/"
}
finally {
  Pop-Location
}
