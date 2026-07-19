param(
  [string]$OutputDir = "dist-package",
  [string]$DeviceName = "",
  [switch]$Sign,
  [string]$CertPath = "",
  # Seller Lounge needs both for FHD + UHD store coverage (default: both).
  [string[]]$Resolutions = @("1920x1080", "1280x720")
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
  if ($LASTEXITCODE -ne 0) {
    throw "npm install failed with exit code $LASTEXITCODE"
  }

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
  # Vite already minifies; ares-package's minifier often fails on legacy/SystemJS bundles
  # and can leave a broken IPK while still exiting non-fatally.
  $packageArgs = @("-o", $PackageDir, "--no-minify")

  $privateKey = $null
  $certificate = $null
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

    Write-Host "Signing enabled"
    Write-Host "  Private key: $privateKey"
    Write-Host "  Certificate: $certificate"
    $packageArgs += @("-s", $privateKey, "-crt", $certificate)
  }

  $appInfoPath = Join-Path $Stage "appinfo.json"
  if (-not (Test-Path $appInfoPath)) {
    throw "Missing $appInfoPath - staging failed"
  }

  $createdIpks = @()
  foreach ($resolution in $Resolutions) {
    if ($resolution -notmatch '^\d+x\d+$') {
      throw "Invalid resolution '$resolution' (expected e.g. 1920x1080 or 1280x720)"
    }

    $appInfo = Get-Content -Raw -Path $appInfoPath | ConvertFrom-Json
    $appInfo.resolution = $resolution
    $appInfo | ConvertTo-Json -Depth 20 | Set-Content -Path $appInfoPath -Encoding utf8

    Write-Host "Packaging IPK for resolution $resolution..."
    & $aresPackage @packageArgs $Stage

    $ipk = Get-ChildItem -Path $PackageDir -Filter "*.ipk" |
      Where-Object { $_.Name -notmatch '_\d+x\d+_all\.ipk$' } |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if (-not $ipk) {
      throw "No IPK was created in $PackageDir for $resolution"
    }

    $newName = ($ipk.BaseName -replace '_all$', "_${resolution}_all") + $ipk.Extension
    $renamed = Join-Path $PackageDir $newName
    if (Test-Path $renamed) {
      Remove-Item -Force $renamed
    }
    Move-Item -Force $ipk.FullName $renamed
    $createdIpks += (Get-Item $renamed)
    Write-Host "Created package: $renamed"
  }

  # Restore staged appinfo to the primary (UHD) resolution for local/dev installs.
  $restore = Get-Content -Raw -Path (Join-Path $Root "appinfo.json") | ConvertFrom-Json
  $restore | ConvertTo-Json -Depth 20 | Set-Content -Path $appInfoPath -Encoding utf8

  if (-not $shouldSign) {
    Write-Host ""
    Write-Host "IPKs ready for LG Content Store upload (no separate signing certificate needed)."
    Write-Host "Upload BOTH resolutions in Seller Lounge File Upload:"
    Write-Host "  1920x1080 -> Ultra HD (UHD) models"
    Write-Host "  1280x720  -> Full HD (FHD) models"
  } else {
    Write-Host "Signed packages ready for LG Content Store upload."
  }

  if ($DeviceName) {
    $aresInstall = Resolve-WebOSCliExe "ares-install"
    $aresLaunch = Resolve-WebOSCliExe "ares-launch"
    $installIpk = $createdIpks | Where-Object { $_.Name -match '_1920x1080_all\.ipk$' } | Select-Object -First 1
    if (-not $installIpk) {
      $installIpk = $createdIpks | Select-Object -First 1
    }
    if ($aresInstall -and $installIpk) {
      Write-Host "Installing to device $DeviceName..."
      & $aresInstall -d $DeviceName $installIpk.FullName
      if ($aresLaunch) {
        & $aresLaunch -d $DeviceName com.eyediatech.eyedeeaphotos
      }
    }
  }
}
finally {
  Pop-Location
}
