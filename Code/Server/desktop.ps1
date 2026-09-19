param([switch]$Watch, [switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
try {
    Add-Type -Path (Join-Path $PSScriptRoot 'desktop-native.cs') -ReferencedAssemblies System.Drawing,System.Windows.Forms
    if ($CheckOnly) {
        @{ ok=$true; inputSize=[NexoDesktop]::InputSize() } | ConvertTo-Json -Compress
    } elseif ($Watch) {
        [Console]::WriteLine('READY')
        while ($true) {
            if ([NexoDesktop]::StopPressed()) { [Console]::WriteLine('STOP'); break }
            Start-Sleep -Milliseconds 40
        }
    } else {
        $request = [Console]::In.ReadToEnd() | ConvertFrom-Json
        if ($request.operation -eq 'observe') {
            [NexoDesktop]::Capture() | ConvertTo-Json -Depth 5 -Compress
        } elseif ($request.operation -eq 'action') {
            $a=$request.action; $b=$request.bounds
            [NexoDesktop]::Act($a.action,$a.x,$a.y,$a.x2,$a.y2,$a.text,$a.key,$a.steps,$a.button,$b.left,$b.top,$b.screenWidth,$b.screenHeight)
            @{ok=$true} | ConvertTo-Json -Compress
        } elseif ($request.operation -eq 'release') {
            [NexoDesktop]::Release()
            @{ok=$true} | ConvertTo-Json -Compress
        } else { throw 'Unbekannter Auftrag.' }
    }
} catch {
    @{error=$_.Exception.Message} | ConvertTo-Json -Compress
    exit 1
}
