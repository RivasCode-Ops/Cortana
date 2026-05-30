# Diagnostico rapido do ambiente de dev
Write-Host "`n=== Dev Check - Ultra UB422 ===" -ForegroundColor Cyan

$os = Get-CimInstance Win32_OperatingSystem
$freeMb = [math]::Round($os.FreePhysicalMemory / 1KB, 0)
$totalMb = [math]::Round($os.TotalVisibleMemorySize / 1KB, 0)
$pct = [math]::Round(($freeMb / $totalMb) * 100, 1)

$ramColor = if ($freeMb -lt 500) { "Red" } elseif ($freeMb -lt 1000) { "Yellow" } else { "Green" }
Write-Host "RAM: ${freeMb} MB livre / ${totalMb} MB (${pct}%)" -ForegroundColor $ramColor

function Test-Tool($name, $cmd) {
    try {
        $v = Invoke-Expression $cmd 2>$null
        Write-Host "[OK] $name : $v" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[--] $name : nao encontrado" -ForegroundColor Red
        return $false
    }
}

Test-Tool "Git" "git --version"
Test-Tool "Python" "python --version"
Test-Tool "Node" "node --version"
Test-Tool "npm" "npm --version"
Test-Tool "pip" "python -m pip --version"

Write-Host "`n--- Virtualizacao ---" -ForegroundColor Cyan
wsl -l -v 2>$null
$docker = Get-Process "Docker Desktop","com.docker.backend" -ErrorAction SilentlyContinue
if ($docker) { Write-Host "[!!] Docker rodando - consome RAM" -ForegroundColor Yellow }
else { Write-Host "[OK] Docker parado" -ForegroundColor Green }

Write-Host "`n--- Top RAM ---" -ForegroundColor Cyan
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 6 |
    ForEach-Object { Write-Host ("  {0,-20} {1,4} MB" -f $_.Name, [math]::Round($_.WorkingSet64/1MB,0)) }

if ($freeMb -lt 500) {
    Write-Host "`nDica: rode dev-mode-on.ps1 para liberar RAM" -ForegroundColor Yellow
}
