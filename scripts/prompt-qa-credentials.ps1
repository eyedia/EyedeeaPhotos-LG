/**
 * Interactive PowerShell helper: prompts for QA credentials and writes
 * .env.submission + updates TESTER_NOTES.txt (never commit .env.submission).
 */
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env.submission'

Write-Host 'Eyedeea Photos — LG QA test account'
Write-Host 'Account must have an active subscription and photos in the library.'
Write-Host ''

$email = Read-Host 'QA email'
$secure = Read-Host 'QA password' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if (-not $email -or -not $password) {
  throw 'Email and password are required.'
}

@"
SUBMISSION_QA_EMAIL=$email
SUBMISSION_QA_PASSWORD=$password
"@ | Set-Content -Path $envFile -Encoding utf8

Write-Host "Wrote $envFile (gitignored)"
Push-Location $root
try {
  node scripts/fill-tester-notes.mjs
} finally {
  Pop-Location
}

Write-Host 'Done. Paste submission/TESTER_NOTES.txt into Seller Lounge Test Info.'
