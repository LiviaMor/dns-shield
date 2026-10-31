# DNS Shield - prova o bloqueio (Windows / PowerShell), sem mudar o DNS do PC.
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

Write-Host '=== Testando o bloqueio direto no Pi-hole local ==='
Write-Host ''
Write-Host '1) Site normal (deve resolver um IP real):'
$gh = docker exec dns-shield-local dig +short '@127.0.0.1' github.com
Write-Host "   github.com -> $($gh | Select-Object -First 1)"
Write-Host ''
Write-Host '2) Dominios de ANUNCIO/RASTREIO (devem retornar 0.0.0.0 = BLOQUEADO):'
foreach ($d in @('doubleclick.net','ads.google.com','googlesyndication.com','google-analytics.com')) {
    $res = docker exec dns-shield-local dig +short '@127.0.0.1' $d | Select-Object -First 1
    if ([string]::IsNullOrEmpty($res) -or $res -eq '0.0.0.0') {
        Write-Host ("   {0,-26} -> BLOQUEADO" -f $d)
    } else {
        Write-Host ("   {0,-26} -> {1}" -f $d, $res)
    }
}
Write-Host ''
Write-Host 'Para proteger o navegador de verdade, rode .\connect.ps1'
