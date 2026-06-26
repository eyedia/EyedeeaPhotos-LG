param(
  [string]$OutputDir = "dist-package",
  [string]$DeviceName = "",
  [switch]$Sign,
  [string]$CertPath = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Resolve-CertPath {
  param([string]$ExplicitPath)

  if ($ExplicitPath) {
    return $ExplicitPath
  }

  if ($env:LG_WEBOS_TV_CERT) {
    return $env:LG_WEBOS_TV_CERT
  }

  $defaultCert = Join-Path $Root "certs\developer.pem"
  if (Test-Path $defaultCert) {
    return $defaultCert
  }

  return $null
}

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
  if (-not $ipk) {
    throw "No IPK was created in $PackageDir"
  }

  Write-Host "Created package: $($ipk.FullName)"

  $shouldSign = $Sign -or $CertPath
  if ($shouldSign) {
    $aresSign = Get-Command ares-sign -ErrorAction SilentlyContinue
    if (-not $aresSign) {
      throw "ares-sign not found. Install webOS TV CLI (see docs/LG_PREREQUISITES.md)."
    }

    $cert = Resolve-CertPath -ExplicitPath $CertPath
    if (-not $cert -or -not (Test-Path $cert)) {
      throw @"
Certificate not found for signing.
  Pass -CertPath path\to\developer.pem
  Or set LG_WEBOS_TV_CERT environment variable
  Or place cert at certs\developer.pem (gitignored)
See docs/LG_PREREQUISITES.md for creating a certificate in Seller Lounge.
"@
    }

    Write-Host "Signing IPK with certificate: $cert"
    & ares-sign -c $cert $ipk.FullName
    Write-Host "Signed package ready for LG Content Store upload: $($ipk.FullName)"
  } else {
    Write-Host ""
    Write-Host "Note: IPK is unsigned. LG Content Store requires a signed IPK."
    Write-Host "Re-run with -Sign after placing your developer certificate:"
    Write-Host "  powershell -File scripts/build-ipk.ps1 -Sign -CertPath path\to\developer.pem"
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
