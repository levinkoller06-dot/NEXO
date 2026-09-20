param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$serverPath = Join-Path $PSScriptRoot 'server.js'
$repoCode = Split-Path $PSScriptRoot
$port = 4790
$envPath = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $envPath) {
    foreach ($line in [IO.File]::ReadAllLines($envPath)) {
        if ($line -match '^\s*PORT\s*=\s*(\d+)\s*$') { $port = [int]$Matches[1] }
    }
}
if ($port -lt 1 -or $port -gt 65535) { throw 'Ungültiger PORT in Server/.env.' }
try {
    $nodeCommand = Get-Command node.exe -ErrorAction Stop
    $nodePath = $nodeCommand.Source
    if ($CheckOnly) {
        @{ok=$true; port=$port; nodeAvailable=$true} | ConvertTo-Json -Compress
        exit 0
    }
    $url = "http://127.0.0.1:$port"
    $health = $null
    try { $health = Invoke-RestMethod "$url/api/health" -TimeoutSec 2 } catch {}
    if (-not $health -or $health.version -ne 21) {
        # Never stop an unrelated process merely because it uses this port.
        $listeners = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
        foreach ($listener in $listeners) {
            $serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
            if ($serverProcess -and $serverProcess.Name -eq 'node.exe' -and $serverProcess.CommandLine -and
                $serverProcess.CommandLine.IndexOf($serverPath,[StringComparison]::OrdinalIgnoreCase) -ge 0) {
                Stop-Process -Id $serverProcess.ProcessId -ErrorAction Stop
            } else { throw "Port $port ist durch einen anderen oder nicht eindeutig erkannten Prozess belegt. Bitte diesen zuerst schließen." }
        }
        $logDir = Join-Path $repoCode 'logs'
        if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
        $quotedServer = '"' + $serverPath + '"'
        Start-Process -FilePath $nodePath -ArgumentList $quotedServer -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'server-out.log') -RedirectStandardError (Join-Path $logDir 'server-error.log') | Out-Null
        $healthy=$false
        for ($attempt=0; $attempt -lt 30; $attempt++) {
            try {
                $health=Invoke-RestMethod "$url/api/health" -TimeoutSec 1
                if ($health.version -eq 21) { $healthy=$true; break }
            } catch {}
            Start-Sleep -Milliseconds 200
        }
        if (-not $healthy) { throw 'NEXO konnte nicht starten. Details stehen in Code/logs/server-error.log.' }
    }
    $edgeCandidates = @((Join-Path ([Environment]::GetFolderPath('ProgramFilesX86')) 'Microsoft\Edge\Application\msedge.exe'),(Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'))
    $edge = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if ($edge) { Start-Process -FilePath $edge -ArgumentList "--app=$url/","--window-size=1440,940" }
    else { Start-Process "$url/" }
} catch {
    if ($CheckOnly) { throw }
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message,'NEXO konnte nicht starten') | Out-Null
    exit 1
}
