$node = "C:\Program Files\nodejs\node.exe"
$vite = "node_modules\vite\bin\vite.js"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $node
$psi.Arguments = "$vite --port=3000 --host=0.0.0.0"
$psi.WorkingDirectory = $PSScriptRoot
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$psi.CreateNoWindow = $true
$psi.UseShellExecute = $false
$p = [System.Diagnostics.Process]::Start($psi)
if ($p) {
    Write-Host "Vite dev server started with PID: $($p.Id)"
}
