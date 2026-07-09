# Ensures webOS TV CLI tools (ares, ares-package, etc.) are on PATH for PowerShell.
# PowerShell does not expand %WEBOS_CLI_TV% entries in PATH — CMD does.
# Cursor/VS Code terminals may also miss User PATH updates until the app is restarted.

function Read-DotEnvValue {
  param(
    [string]$Root,
    [string]$Key
  )

  foreach ($file in @(".env.local", ".env")) {
    $path = Join-Path $Root $file
    if (-not (Test-Path $path)) {
      continue
    }

    $pattern = '^\s*' + [regex]::Escape($Key) + '\s*=\s*(.+?)\s*$'
    $line = Get-Content $path | Where-Object { $_ -match $pattern } | Select-Object -First 1
    if ($line -and $line -match $pattern) {
      return $matches[1].Trim().Trim('"').Trim("'")
    }
  }

  return $null
}

function Set-ModernNodeFirst {
  $systemNode = Join-Path ${env:ProgramFiles} 'nodejs'
  if (-not (Test-Path $systemNode)) {
    return
  }

  $normalized = $systemNode.TrimEnd('\')
  $pathParts = $env:Path -split ';' | Where-Object { $_ -and $_.TrimEnd('\') -ne $normalized }
  $env:Path = "$normalized;" + ($pathParts -join ';')
}

function Initialize-WebOSEnvironment {
  param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
  )

  if (-not $env:LG_WEBOS_TV_SDK_HOME) {
    $fromEnv = Read-DotEnvValue -Root $ProjectRoot -Key "LG_WEBOS_TV_SDK_HOME"
    if ($fromEnv) {
      $env:LG_WEBOS_TV_SDK_HOME = $fromEnv
    }
  }

  $cliBin = $null

  if ($env:LG_WEBOS_TV_SDK_HOME) {
    $cliBin = Join-Path $env:LG_WEBOS_TV_SDK_HOME "CLI\bin"
  }

  if (-not $cliBin -or -not (Test-Path $cliBin)) {
    if ($env:WEBOS_CLI_TV -and (Test-Path $env:WEBOS_CLI_TV)) {
      $cliBin = $env:WEBOS_CLI_TV
    }
  }

  if ($cliBin -and (Test-Path $cliBin)) {
    $normalized = $cliBin.TrimEnd('\')
    if ($env:Path -notlike "*$normalized*") {
      $env:Path = "$normalized;$env:Path"
    }
    if (-not $env:LG_WEBOS_TV_SDK_HOME) {
      $env:LG_WEBOS_TV_SDK_HOME = Split-Path (Split-Path $normalized -Parent) -Parent
    }
  }

  # SDK CLI\bin bundles Node 8 — always prefer system Node for npm/vite.
  Set-ModernNodeFirst
}

function Resolve-WebOSCliExe {
  param(
    [Parameter(Mandatory)]
    [string]$Name
  )

  $sdkHome = $env:LG_WEBOS_TV_SDK_HOME
  if (-not $sdkHome) {
    return $null
  }

  $cliBin = Join-Path $sdkHome "CLI\bin"
  if (-not (Test-Path $cliBin)) {
    return $null
  }

  # PowerShell resolves npm's ares-*.ps1 (@webosose/ares-cli) before SDK .cmd on PATH.
  $cmd = Join-Path $cliBin "$Name.cmd"
  if (Test-Path $cmd) {
    return $cmd
  }

  $sh = Join-Path $cliBin $Name
  if (Test-Path $sh) {
    return $sh
  }

  return $null
}

Initialize-WebOSEnvironment
