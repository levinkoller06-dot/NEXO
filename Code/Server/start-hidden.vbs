' Launches the NEXO Core server with no visible console window at all.
' WshShell.Run's second argument (0) means "hidden window".
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir
WshShell.Run "node.exe """ & scriptDir & "\server.js""", 0, False
