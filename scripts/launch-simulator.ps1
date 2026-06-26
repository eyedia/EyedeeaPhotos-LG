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

Write-Host "Staging dist/ for simulator (icons + build)..."
& "$PSScriptRoot\stage-webos.ps1" -SkipInstall

$aresLaunch = Get-Command ares-launch -ErrorAction SilentlyContinue
if (-not $aresLaunch) {
  throw "ares-launch not found. Install webOS TV CLI (see TESTING.md)."
}

Write-Host "Launching on webOS TV $ver Simulator..."
& ares-launch -s $ver $dist
