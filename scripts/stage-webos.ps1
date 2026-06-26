param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

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

  $webOsDir = Join-Path $Stage "webOSTVjs"
  New-Item -ItemType Directory -Force -Path $webOsDir | Out-Null

  $officialJs = Resolve-OfficialWebOSTVJs
  if ($officialJs) {
    Write-Host "Using official webOSTV.js from SDK: $officialJs"
    Copy-Item -Force $officialJs (Join-Path $webOsDir "webOSTV.js")
  } else {
    Write-Warning "LG_WEBOS_TV_SDK_HOME not set or webOSTV.js not found - using bundled stub."
    Write-Warning "Set LG_WEBOS_TV_SDK_HOME for production builds (see docs/LG_PREREQUISITES.md)."
    Copy-Item -Force (Join-Path $Root "public\webOSTVjs\webOSTV.js") (Join-Path $webOsDir "webOSTV.js")
  }

  Write-Host "Staged webOS app at dist/"
}
finally {
  Pop-Location
}
