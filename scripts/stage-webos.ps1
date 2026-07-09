param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\webos-env.ps1"

function Resolve-OfficialWebOSTVJs {
  $sdkHome = $env:LG_WEBOS_TV_SDK_HOME
  if (-not $sdkHome) {
    return $null
  }

  $candidates = @(
    (Join-Path $sdkHome "APIs\webOSTV.js\webOSTV.js"),
    (Join-Path $sdkHome "SDK\APIs\webOSTV.js\webOSTV.js"),
    (Join-Path $sdkHome "webOSTVjs\webOSTV.js")
  )

  foreach ($path in $candidates) {
    if (Test-Path $path) {
      return $path
    }
  }

  # CLI-only SDK installs ship webOSTV.js inside bootplate templates (no separate APIs pack).
  $fromCli = Get-ChildItem (Join-Path $sdkHome "CLI") -Recurse -Filter "webOSTV.js" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match 'webOSTVjs' } |
    Select-Object -First 1 -ExpandProperty FullName
  if ($fromCli) {
    return $fromCli
  }

  return $null
}

Push-Location $Root
try {
  if (-not $SkipInstall) {
    Write-Host "Installing dependencies..."
    npm install
  }

  Write-Host "Generating icons..."
  npm run icons
  if ($LASTEXITCODE -ne 0) { throw "npm run icons failed - need Node 18 or newer" }

  npm run submission-assets
  if ($LASTEXITCODE -ne 0) { throw "npm run submission-assets failed" }

  Write-Host "Building web app..."
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed - need Node 18 or newer" }

  $Stage = Join-Path $Root "dist"
  if (-not (Test-Path $Stage)) {
    throw "Build output not found at dist/"
  }

  Write-Host "Copying webOS metadata into dist..."
  Copy-Item -Force (Join-Path $Root "appinfo.json") (Join-Path $Stage "appinfo.json")
  Copy-Item -Force (Join-Path $Root "public\icon.png") (Join-Path $Stage "icon.png")
  Copy-Item -Force (Join-Path $Root "public\largeIcon.png") (Join-Path $Stage "largeIcon.png")
  if (Test-Path (Join-Path $Root "public\icon-400.png")) {
    Copy-Item -Force (Join-Path $Root "public\icon-400.png") (Join-Path $Stage "icon-400.png")
  }
  Copy-Item -Force (Join-Path $Root "public\logo.svg") (Join-Path $Stage "logo.svg")

  $webOsDir = Join-Path $Stage "webOSTVjs"
  New-Item -ItemType Directory -Force -Path $webOsDir | Out-Null

  $officialJs = Resolve-OfficialWebOSTVJs
  if ($officialJs) {
    Write-Host "Using official webOSTV.js from SDK: $officialJs"
    Copy-Item -Force $officialJs (Join-Path $webOsDir "webOSTV.js")
  } else {
    if (-not $env:LG_WEBOS_TV_SDK_HOME) {
      Write-Warning "LG_WEBOS_TV_SDK_HOME is not set - using bundled webOSTV.js stub."
      Write-Warning "Set LG_WEBOS_TV_SDK_HOME in .env.local (see docs/LG_PREREQUISITES.md)."
    } else {
      Write-Warning "webOSTV.js not found under $($env:LG_WEBOS_TV_SDK_HOME) - using bundled stub."
      Write-Warning "Add the LG APIs pack (APIs\webOSTV.js\) or reinstall CLI+APIs together (see docs/LG_PREREQUISITES.md)."
    }
    Copy-Item -Force (Join-Path $Root "public\webOSTVjs\webOSTV.js") (Join-Path $webOsDir "webOSTV.js")
  }

  Write-Host "Staged webOS app at dist/"
}
finally {
  Pop-Location
}
