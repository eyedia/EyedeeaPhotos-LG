$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$ok = $true

Write-Host "=== Eyedeea Photos dev environment ==="
Write-Host ""

function Get-SimVersionFromEnvFiles {
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

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $nodeVer = & node -v
  Write-Host "[OK]   Node $nodeVer"
} else {
  Write-Host "[FAIL] Node not found"
  $ok = $false
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if ($npm) {
  $npmVer = & npm -v
  Write-Host "[OK]   npm $npmVer"
} else {
  Write-Host "[FAIL] npm not found"
  $ok = $false
}

$ares = Get-Command ares -ErrorAction SilentlyContinue
if ($ares) {
  $aresVer = & ares -V 2>&1 | Out-String
  Write-Host "[OK]   $($aresVer.Trim())"
} else {
  Write-Host "[FAIL] ares CLI not found - install webOS TV CLI (see TESTING.md)"
  $ok = $false
}

$simVersion = Get-SimVersionFromEnvFiles
Write-Host ('[INFO] WEBOS_SIM_VERSION = ' + $simVersion)

$nodeModules = Join-Path $Root "node_modules"
if (Test-Path $nodeModules) {
  Write-Host "[OK]   node_modules present"
} else {
  Write-Host "[WARN] node_modules missing - run npm install"
}

$dist = Join-Path $Root "dist"
$appinfo = Join-Path $dist "appinfo.json"
if (Test-Path $appinfo) {
  Write-Host "[OK]   dist/ is staged (appinfo.json present)"
} else {
  Write-Host "[INFO] dist/ not staged yet - run npm run stage:webos"
}

$icon = Join-Path $Root "public\icon.png"
if (Test-Path $icon) {
  Write-Host "[OK]   public/icon.png exists"
} else {
  Write-Host "[WARN] public/icon.png missing - run npm run icons"
}

Write-Host ""
if (-not $ok) {
  Write-Host "Some checks failed. See TESTING.md for setup instructions."
  exit 1
}

Write-Host "Environment looks ready."
exit 0
