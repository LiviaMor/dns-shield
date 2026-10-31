#!/usr/bin/env bash
# DNS Shield — Demo multiplataforma (macOS e Linux)
# Uso:
#   ./demo.sh up      # sobe a simulação e mostra o fluxo
#   ./demo.sh logs    # acompanha os logs
#   ./demo.sh down     # derruba tudo
#   ./demo.sh clean    # derruba e remove volumes/imagens da demo
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE_FILE="docker-compose.simulation.yml"
API="http://localhost:3000/api"
TENANT="clinica-demo"

# Detecta "docker compose" (v2) ou "docker-compose" (v1).
if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "ERRO: Docker Compose não encontrado. Instale o Docker Desktop." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERRO: o Docker não está rodando. Inicie o Docker Desktop (ou OrbStack) e tente de novo." >&2
  exit 1
fi

cmd="${1:-up}"

wait_for_health() {
  echo "==> Aguardando o backend ficar saudável..."
  for i in $(seq 1 30); do
    if curl -fs "$API/health" >/dev/null 2>&1; then
      echo "    backend OK."
      return 0
    fi
    sleep 2
  done
  echo "ERRO: backend não respondeu a tempo." >&2
  return 1
}

show_flow() {
  echo
  echo "===================== FLUXO DNS SHIELD ====================="
  echo "1) Health:"
  curl -fs "$API/health"; echo
  echo
  echo "2) Topologia descoberta e classificada (enviada pelo edge-discovery):"
  curl -fs "$API/topology" -H "X-Tenant-Id: $TENANT" \
    | python3 -m json.tool 2>/dev/null || curl -fs "$API/topology" -H "X-Tenant-Id: $TENANT"
  echo
  echo "============================================================"
  echo "============================================================"
  echo "Painel do cliente:  http://localhost:8088"
  echo "Painel do Pi-hole:  http://localhost:8080/admin  (senha: a definida em PIHOLE_PASSWORD)"
  echo "API:                $API"
  echo "------------------------------------------------------------"
  echo "3) Teste de DNS real pelo Pi-hole:"
  local pihole_ip
  pihole_ip="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' dns-shield-pihole 2>/dev/null || true)"
  if command -v dig >/dev/null 2>&1 && [ -n "$pihole_ip" ] && dig +short +time=3 @"$pihole_ip" github.com >/dev/null 2>&1; then
    echo "    resolvendo github.com via Pi-hole ($pihole_ip):"
    dig +short +time=3 @"$pihole_ip" github.com | sed 's/^/      /'
  else
    echo "    (teste direto no container):"
    docker exec dns-shield-pihole dig +short +time=3 @127.0.0.1 github.com 2>/dev/null | sed 's/^/      /' \
      || echo "      Pi-hole ainda inicializando — tente: docker exec dns-shield-pihole dig @127.0.0.1 github.com"
  fi
  echo "============================================================"
}

case "$cmd" in
  up)
    echo "==> Construindo e subindo os containers..."
    "${DC[@]}" -f "$COMPOSE_FILE" up -d --build
    wait_for_health
    echo "==> Rodando a descoberta de rede (simulada)..."
    "${DC[@]}" -f "$COMPOSE_FILE" logs edge-discovery | tail -n 20 || true
    show_flow
    ;;
  logs)
    "${DC[@]}" -f "$COMPOSE_FILE" logs -f
    ;;
  down)
    "${DC[@]}" -f "$COMPOSE_FILE" down
    ;;
  clean)
    "${DC[@]}" -f "$COMPOSE_FILE" down -v --rmi local
    ;;
  *)
    echo "Uso: $0 {up|logs|down|clean}" >&2
    exit 1
    ;;
esac
