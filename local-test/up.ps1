# DNS Shield - sobe o teste local (Windows / PowerShell).
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

try { docker info *> $null; if ($LASTEXITCODE -ne 0) { throw } }
catch { Write-Error 'Docker nao esta rodando (abra Docker Desktop).'; exit 1 }

$Dc = if ((docker compose version 2>$null; $LASTEXITCODE) -eq 0) { @('docker','compose') } else { @('docker-compose') }

Write-Host '==> Subindo o Pi-hole local...'
& $Dc[0] ($Dc[1..($Dc.Length-1)] + @('up','-d'))

Write-Host '==> Aguardando o Pi-hole carregar as blocklists (~30s)...'
Start-Sleep -Seconds 30

Write-Host ''
Write-Host '============================================================'
Write-Host ' Pi-hole local no ar.'
Write-Host '   Painel:  http://localhost:8090/admin   (senha: demo1234)'
Write-Host '   DNS:     porta 53 deste computador'
Write-Host ''
Write-Host ' Proximo passo:  .\connect.ps1   (como apontar o DNS)'
Write-Host ' Testar agora:   .\test-block.ps1'
Write-Host '============================================================'
