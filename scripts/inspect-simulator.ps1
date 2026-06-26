param(
  [string]$SimulatorVersion = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\webos-env.ps1"

function Get-SimVersion {
  param([string]$Override)

  if ($Override) {
    return $Override
  }

  if ($env:WEBOS_SIM_VERSION) {
    return $env:WEBOS_SIM_VERSION
  }

  foreach ($file in @(".env.local", ".env")) {
    $path = Join-Path $Root $file
    if (-not (Test-Path $path)) {
      continue
    }

    $line = Get-Content $path | Where-Object { $_ -match '^\s*WEBOS_SIM_VERSION\s*=' } | Select-Object -First 1
    if ($line -and $line -match '=\s*(\d+)') {
      return $matches[1]
    }
  }

  return "25"
}

$ver = Get-SimVersion $SimulatorVersion
$dist = Join-Path $Root "dist"

if (-not (Test-Path (Join-Path $dist "appinfo.json"))) {
  throw "dist/ not staged. Run npm run stage:webos first."
}

$aresInspect = Get-Command ares-inspect -ErrorAction SilentlyContinue
if (-not $aresInspect) {
  throw "ares-inspect not found. Install webOS TV CLI (see TESTING.md)."
}

Write-Host "Opening inspector for webOS TV $ver Simulator..."
& ares-inspect -s $ver $dist
