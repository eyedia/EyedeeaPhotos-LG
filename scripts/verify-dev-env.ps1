$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\webos-env.ps1"
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
  Write-Host "[FAIL] ares CLI not found - install webOS TV CLI (see docs/LG_PREREQUISITES.md)"
  $ok = $false
}

foreach ($cmd in @("ares-package", "ares-install", "ares-launch")) {
  $found = Get-Command $cmd -ErrorAction SilentlyContinue
  if ($found) {
    Write-Host "[OK]   $cmd available"
  } else {
    Write-Host "[WARN] $cmd not found - required for packaging/signing/TV install"
  }
}

$sdkHome = $env:LG_WEBOS_TV_SDK_HOME
if ($sdkHome -and (Test-Path $sdkHome)) {
  Write-Host "[OK]   LG_WEBOS_TV_SDK_HOME = $sdkHome"
  $sdkJs = @(
    (Join-Path $sdkHome "APIs\webOSTV.js\webOSTV.js"),
    (Join-Path $sdkHome "SDK\APIs\webOSTV.js\webOSTV.js")
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($sdkJs) {
    Write-Host "[OK]   Official webOSTV.js found in SDK"
  } else {
    Write-Host "[WARN] webOSTV.js not found under SDK - production builds will use stub"
  }
} else {
  Write-Host "[WARN] LG_WEBOS_TV_SDK_HOME not set - see docs/LG_PREREQUISITES.md"
}

$cert = $env:LG_WEBOS_TV_CERT
$defaultKey = Join-Path $Root "certs\developer.pem"
$defaultCrt = Join-Path $Root "certs\developer.crt"
if ($cert -and (Test-Path $cert)) {
  Write-Host "[OK]   LG_WEBOS_TV_CERT configured (private key)"
} elseif (Test-Path $defaultKey) {
  Write-Host "[OK]   certs/developer.pem present"
} else {
  Write-Host "[INFO] No developer private key found - download from Seller Lounge before signed build"
}
if ((Test-Path $defaultCrt) -or $env:LG_WEBOS_TV_CERT_CRT) {
  Write-Host "[OK]   developer.crt configured for signed packaging"
} elseif ($cert -or (Test-Path $defaultKey)) {
  Write-Host "[WARN] developer.crt missing - signed build needs both .pem and .crt"
}

$simVersion = Get-SimVersionFromEnvFiles
Write-Host ('[INFO] WEBOS_SIM_VERSION = ' + $simVersion)

$nodeModules = Join-Path $Root "node_modules"
if (Test-Path $nodeModules) {
  Write-Host "[OK]   node_modules present"
} else {
  Write-Host "[WARN] node_modules missing - run npm install"
}

$icon = Join-Path $Root "public\icon.png"
if (Test-Path $icon) {
  Write-Host "[OK]   public/icon.png exists"
} else {
  Write-Host "[WARN] public/icon.png missing - run npm run icons"
}

$dist = Join-Path $Root "dist"
$appinfo = Join-Path $dist "appinfo.json"
if (Test-Path $appinfo) {
  Write-Host "[OK]   dist/ is staged (appinfo.json present)"
} else {
  Write-Host "[INFO] dist/ not staged yet - run npm run stage:webos"
}

Write-Host ""
if (-not $ok) {
  Write-Host "Some checks failed. See docs/LG_PREREQUISITES.md for setup instructions."
  exit 1
}

Write-Host "Environment looks ready."
exit 0
