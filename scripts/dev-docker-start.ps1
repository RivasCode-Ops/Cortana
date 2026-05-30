# Inicia Docker com limite de RAM (use so quando precisar de containers)
# Requer reinicio do Docker Desktop apos alterar .wslconfig

Write-Host "Iniciando Docker Desktop..."
Start-Process "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
Write-Host "Aguarde ~60s. Docker limitado a ~1.5 GB via .wslconfig"
