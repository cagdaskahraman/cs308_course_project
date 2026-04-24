# Stops processes listening on default dev ports (Nest + Vite).
# Override: $env:BACKEND_PORT / $env:FRONTEND_PORT

$ErrorActionPreference = 'Continue'
$backendPort = if ($env:BACKEND_PORT) { [int]$env:BACKEND_PORT } else { 3000 }
$frontendPort = if ($env:FRONTEND_PORT) { [int]$env:FRONTEND_PORT } else { 5173 }
$ports = @($backendPort, $frontendPort)

foreach ($port in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $conns) {
    Write-Host "[OK] Nothing listening on port $port"
    continue
  }
  $procIds = @($conns | Select-Object -ExpandProperty OwningProcess -Unique)
  foreach ($procId in $procIds) {
    try {
      $p = Get-Process -Id $procId -ErrorAction Stop
      Write-Host "[STOP] Port $port  PID $procId  $($p.ProcessName)"
      Stop-Process -Id $procId -Force -ErrorAction Stop
    } catch {
      Write-Host "[WARN] Port $port  PID $procId  $($_.Exception.Message)"
    }
  }
}

Write-Host ""
Write-Host "Done."
