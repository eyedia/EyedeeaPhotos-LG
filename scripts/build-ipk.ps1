param(
  [string]$OutputDir = "dist-package",
  [string]$DeviceName = "",
  [switch]$Sign,
  [string]$CertPath = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\webos-env.ps1"

function Resolve-PrivateKeyPath {
  param([string]$ExplicitPath)

  if ($ExplicitPath) {
    return $ExplicitPath
  }

  if ($env:LG_WEBOS_TV_CERT) {
    return $env:LG_WEBOS_TV_CERT
  }

  $defaultKey = Join-Path $Root "certs\developer.pem"
  if (Test-Path $defaultKey) {
    return $defaultKey
  }

  return $null
}

function Resolve-CertificatePath {
  param([string]$PrivateKeyPath)

  if ($env:LG_WEBOS_TV_CERT_CRT) {
    return $env:LG_WEBOS_TV_CERT_CRT
  }

  $defaultCrt = Join-Path $Root "certs\developer.crt"
  if (Test-Path $defaultCrt) {
    return $defaultCrt
  }

  if ($PrivateKeyPath) {
    $siblingCrt = [System.IO.Path]::ChangeExtension($PrivateKeyPath, ".crt")
    if (Test-Path $siblingCrt) {
      return $siblingCrt
    }
  }

  return $null
}

Push-Location $Root
try {
  Write-Host "Installing dependencies..."
  npm install

  & "$PSScriptRoot\stage-webos.ps1" -SkipInstall

  $Stage = Join-Path $Root "dist"

  $aresPackage = Resolve-WebOSCliExe "ares-package"
  if (-not $aresPackage) {
    Write-Warning "ares-package not found. Install webOS TV CLI (see TESTING.md)."
    Write-Host "Staged app is ready at dist/ - run 'ares-package dist' after installing CLI."
    exit 0
  }

  $PackageDir = Join-Path $Root $OutputDir
  New-Item -ItemType Directory -Force -Path $PackageDir | Out-Null

  $shouldSign = $Sign -or $CertPath
  $packageArgs = @("-o", $PackageDir)

  if ($shouldSign) {
    $privateKey = Resolve-PrivateKeyPath -ExplicitPath $CertPath
    if (-not $privateKey -or -not (Test-Path $privateKey)) {
      throw @"
Private key not found for signing.
  Pass -CertPath path\to\developer.pem
  Or set LG_WEBOS_TV_CERT environment variable
  Or place key at certs\developer.pem (gitignored)
Download from LG Seller Lounge -> Development (see docs/LG_PREREQUISITES.md).
"@
    }

    $certificate = Resolve-CertificatePath -PrivateKeyPath $privateKey
    if (-not $certificate -or -not (Test-Path $certificate)) {
      throw @"
Certificate (.crt) not found for signing.
  Place developer.crt next to developer.pem in certs\
  Or set LG_WEBOS_TV_CERT_CRT environment variable
Both files come from LG Seller Lounge -> Development.
"@
    }

    Write-Host "Packaging signed IPK..."
    Write-Host "  Private key: $privateKey"
    Write-Host "  Certificate: $certificate"
    $packageArgs += @("-s", $privateKey, "-crt", $certificate)
  } else {
    Write-Host "Packaging IPK..."
  }

  & $aresPackage @packageArgs $Stage

  $ipk = Get-ChildItem -Path $PackageDir -Filter "*.ipk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $ipk) {
    throw "No IPK was created in $PackageDir"
  }

  Write-Host "Created package: $($ipk.FullName)"

  if (-not $shouldSign) {
    Write-Host ""
    Write-Host "IPK ready for LG Content Store upload (no separate signing certificate needed)."
  } else {
    Write-Host "Signed package ready for LG Content Store upload."
  }

  if ($DeviceName) {
    $aresInstall = Resolve-WebOSCliExe "ares-install"
    $aresLaunch = Resolve-WebOSCliExe "ares-launch"
    if ($aresInstall -and $ipk) {
      Write-Host "Installing to device $DeviceName..."
      & $aresInstall -d $DeviceName $ipk.FullName
      if ($aresLaunch) {
        & $aresLaunch -d $DeviceName com.eyediatech.eyedeeaphotos
      }
    }
  }
}
finally {
  Pop-Location
}
