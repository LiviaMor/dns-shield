# DNS Shield - Demo multiplataforma (Windows / PowerShell)
# Uso:
#   .\demo.ps1 up      # sobe a simulacao e mostra o fluxo
#   .\demo.ps1 logs    # acompanha os logs
#   .\demo.ps1 down    # derruba tudo
#   .\demo.ps1 clean   # derruba e remove volumes/imagens da demo

param(
    [Parameter(Position = 0)]
    [ValidateSet('up', 'logs', 'down', 'clean')]
    [string]$Command = 'up'
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$ComposeFile = 'docker-compose.simulation.yml'
$Api = 'http://localhost:3000/api'
$Tenant = 'clinica-demo'

# Detecta "docker compose" (v2) ou "docker-compose" (v1).
$Dc = $null
try {
    docker compose version *> $null
    if ($LASTEXITCODE -eq 0) { $Dc = @('docker', 'compose') }
} catch { }
if (-not $Dc) {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $Dc = @('docker-compose')
    } else {
        Write-Error 'Docker Compose nao encontrado. Instale o Docker Desktop.'
        exit 1
    }
}

try {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Error 'O Docker nao esta rodando. Inicie o Docker Desktop (ou OrbStack) e tente de novo.'
    exit 1
}

function Invoke-Dc {
    param([string[]]$DcArgs)
    & $Dc[0] ($Dc[1..($Dc.Length - 1)] + $DcArgs)
}

function Wait-ForHealth {
    Write-Host '==> Aguardando o backend ficar saudavel...'
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $r = Invoke-WebRequest -Uri "$Api/health" -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -eq 200) { Write-Host '    backend OK.'; return }
        } catch { }
        Start-Sleep -Seconds 2
    }
    Write-Error 'backend nao respondeu a tempo.'
}

function Show-Flow {
    Write-Host ''
    Write-Host '===================== FLUXO DNS SHIELD ====================='
    Write-Host '1) Health:'
    (Invoke-WebRequest -Uri "$Api/health" -UseBasicParsing).Content
    Write-Host ''
    Write-Host '2) Topologia descoberta e classificada:'
    $headers = @{ 'X-Tenant-Id' = $Tenant }
    $resp = Invoke-WebRequest -Uri "$Api/topology" -Headers $headers -UseBasicParsing
    $resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 6
    Write-Host ''
    Write-Host '============================================================'
    Write-Host 'Painel do cliente:  http://localhost:8088'
    Write-Host 'Painel do Pi-hole:  http://localhost:8080/admin  (senha: a definida em PIHOLE_PASSWORD)'
    Write-Host "API:                $Api"
    Write-Host '------------------------------------------------------------'
    Write-Host '3) Teste de DNS real pelo Pi-hole:'
    try {
        docker exec dns-shield-pihole dig +short +time=3 "@127.0.0.1" github.com
    } catch {
        Write-Host '    Pi-hole ainda inicializando. Tente: docker exec dns-shield-pihole dig @127.0.0.1 github.com'
    }
    Write-Host '============================================================'
}

switch ($Command) {
    'up' {
        Write-Host '==> Construindo e subindo os containers...'
        Invoke-Dc @('-f', $ComposeFile, 'up', '-d', '--build')
        Wait-ForHealth
        Write-Host '==> Rodando a descoberta de rede (simulada)...'
        Invoke-Dc @('-f', $ComposeFile, 'logs', 'edge-discovery')
        Show-Flow
    }
    'logs'  { Invoke-Dc @('-f', $ComposeFile, 'logs', '-f') }
    'down'  { Invoke-Dc @('-f', $ComposeFile, 'down') }
    'clean' { Invoke-Dc @('-f', $ComposeFile, 'down', '-v', '--rmi', 'local') }
}
