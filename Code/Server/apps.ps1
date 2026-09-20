# Resolve installed applications without opening Windows Search or injecting input.
function Resolve-NexoApp([string]$Name) {
    $nameKey = $Name.Trim().ToLowerInvariant()
    if ($nameKey -notmatch '^[\p{L}\p{N} ._-]{1,100}$') { throw 'Bitte nur einen Programmnamen angeben, keinen Befehl oder Dateipfad.' }
    $aliases = @{ 'rechner'='calculator'; 'taschenrechner'='calculator'; 'editor'='notepad'; 'datei explorer'='explorer'; 'google chrome'='chrome'; 'microsoft edge'='msedge'; 'edge'='msedge'; 'visual studio code'='code'; 'word'='winword'; 'excel'='excel'; 'powerpoint'='powerpnt' }
    $canonical = $nameKey
    if ($aliases.ContainsKey($nameKey)) { $canonical = $aliases[$nameKey] }
    $exe = $canonical -replace '\.exe$',''
    $exe += '.exe'
    $paths = @()
    foreach ($hive in @('HKCU:','HKLM:')) {
        foreach ($branch in @('SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths','SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths')) {
            $key = Get-Item -LiteralPath "$hive\$branch\$exe" -ErrorAction SilentlyContinue
            if ($key) { $paths += [string]$key.GetValue('') }
        }
    }
    $relatives = @{ 'spotify.exe'='Spotify\Spotify.exe'; 'chrome.exe'='Google\Chrome\Application\chrome.exe'; 'msedge.exe'='Microsoft\Edge\Application\msedge.exe'; 'code.exe'='Programs\Microsoft VS Code\Code.exe'; 'obsidian.exe'='Obsidian\Obsidian.exe' }
    if ($relatives.ContainsKey($exe)) {
        foreach ($root in @($env:APPDATA,$env:LOCALAPPDATA,$env:ProgramFiles,${env:ProgramFiles(x86)})) {
            if ($root) { $paths += Join-Path $root $relatives[$exe] }
        }
    }
    $command = Get-Command -Name $exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) { $paths += $command.Source }
    foreach ($candidate in $paths) {
        $candidate = [Environment]::ExpandEnvironmentVariables($candidate.Trim('"'))
        if ([IO.Path]::IsPathRooted($candidate) -and [IO.Path]::GetExtension($candidate) -eq '.exe' -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return @{kind='exe'; target=$candidate; name=$Name}
        }
    }
    $links = @()
    foreach ($root in @([Environment]::GetFolderPath('Programs'),[Environment]::GetFolderPath('CommonPrograms'))) {
        $links += @(Get-ChildItem -LiteralPath $root -Filter '*.lnk' -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.BaseName.ToLowerInvariant() -in @($nameKey,$canonical) })
    }
    $links = @($links | Sort-Object FullName -Unique)
    if ($links.Count -eq 1) { return @{kind='shortcut'; target=$links[0].FullName; name=$Name} }
    if ($links.Count -gt 1) { throw 'Mehrere passende Verknüpfungen gefunden. Bitte den Programmnamen präzisieren.' }
    $apps = @(Get-StartApps | Where-Object { $_.Name.ToLowerInvariant() -in @($nameKey,$canonical) })
    if ($apps.Count -eq 1 -and $apps[0].AppID -match '^[\w.\-]+![\w.\-]+$') {
        return @{kind='packaged'; target=$apps[0].AppID; name=$apps[0].Name}
    }
    throw "Installiertes Programm '$Name' nicht eindeutig gefunden. Es wurde nichts geöffnet."
}
function Start-NexoApp([string]$Name) {
    $resolved = Resolve-NexoApp $Name
    if ($resolved.kind -eq 'packaged') {
        Start-Process -FilePath (Join-Path $env:WINDIR 'explorer.exe') -ArgumentList ('shell:AppsFolder\' + $resolved.target) | Out-Null
    } else { Start-Process -FilePath $resolved.target | Out-Null }
    return @{ok=$true; name=$resolved.name; method=$resolved.kind; message='Startauftrag an Windows übergeben. Fensterbereitschaft nicht geprüft.'}
}
