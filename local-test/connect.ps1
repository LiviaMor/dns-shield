# DNS Shield - como apontar o DNS para o Pi-hole local no Windows (e reverter).
# Rode o PowerShell como Administrador para aplicar.
Set-Location -Path $PSScriptRoot

Write-Host '============================================================'
Write-Host ' Apontar o DNS para o Pi-hole local (127.0.0.1)'
Write-Host '============================================================'
Write-Host ''
Write-Host 'Descubra o nome da sua interface:'
Write-Host '   Get-NetAdapter | Where-Object Status -eq "Up"'
Write-Host ''
Write-Host 'Ativar (proteger este PC) - troque "Wi-Fi" pelo nome da sua interface:'
Write-Host '   Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses 127.0.0.1'
Write-Host ''
Write-Host 'Reverter (voltar ao DNS automatico):'
Write-Host '   Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ResetServerAddresses'
Write-Host ''
Write-Host 'Limpar cache de DNS apos trocar:'
Write-Host '   Clear-DnsClientCache'
Write-Host ''
Write-Host 'Depois: abra o YouTube e veja os bloqueios em http://localhost:8090/admin'
Write-Host 'LEMBRE DE REVERTER o DNS quando terminar o teste.'
