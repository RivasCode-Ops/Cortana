# Libera RAM para sessao de codigo (4 GB RAM)
# Execute: powershell -ExecutionPolicy Bypass -File dev-mode-on.ps1

Write-Host "=== Modo Dev ON ===" -ForegroundColor Cyan

# Para Docker/WSL (maior consumidor de RAM)
Write-Host "Parando Docker e WSL..."
Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "com.docker.backend" -Force -ErrorAction SilentlyContinue
wsl --shutdown 2>$null

# Para Ollama se estiver rodando
Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "ollama app" -Force -ErrorAction SilentlyContinue

# Para apps nao essenciais para codar
$kill = @("Discord", "Canva", "AdobeCollabSync", "MuseHub")
foreach ($p in $kill) {
    Stop-Process -Name $p -Force -ErrorAction SilentlyContinue
}

# Plano de energia: alto desempenho
$highPerf = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
powercfg /setactive $highPerf 2>$null

$os = Get-CimInstance Win32_OperatingSystem
$freeMb = [math]::Round($os.FreePhysicalMemory / 1KB, 0)
$totalMb = [math]::Round($os.TotalVisibleMemorySize / 1KB, 0)
Write-Host "RAM livre: ${freeMb} MB / ${totalMb} MB" -ForegroundColor Green
Write-Host "Pronto para codar. Use Cursor + 1 browser leve." -ForegroundColor Green
