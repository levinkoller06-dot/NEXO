' Hidden bootstrap; launch.ps1 waits for the server before opening the HUD.
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir
WshShell.Run "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File """ & scriptDir & "\launch.ps1""", 0, False
