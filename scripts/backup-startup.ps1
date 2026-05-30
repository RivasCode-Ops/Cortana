# Backup das entradas de inicializacao antes de otimizar
$backupPath = "$PSScriptRoot\..\config\startup-backup.json"
$hkcu = Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -ErrorAction SilentlyContinue
$hkcu | Select-Object * -ExcludeProperty PS* | ConvertTo-Json | Set-Content $backupPath -Encoding UTF8
Write-Host "Backup salvo em: $backupPath"
