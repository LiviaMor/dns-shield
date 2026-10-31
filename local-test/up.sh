#!/usr/bin/env bash
# DNS Shield — sobe o teste local (Mac/Linux).
set -euo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "ERRO: Docker não está rodando (abra Docker Desktop ou OrbStack)." >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then DC=(docker compose); else DC=(docker-compose); fi

echo "==> Subindo o Pi-hole local..."
"${DC[@]}" up -d

echo "==> Aguardando o Pi-hole carregar as blocklists (~30s)..."
for i in $(seq 1 30); do
  if docker exec dns-shield-local dig +short +time=2 @127.0.0.1 doubleclick.net >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo
echo "============================================================"
echo " Pi-hole local no ar."
echo "   Painel:  http://localhost:8090/admin   (senha: a definida em PIHOLE_PASSWORD)"
echo "   DNS:     porta 53 deste computador"
echo
echo " Próximo passo:  ./connect.sh   (como apontar o DNS)"
echo " Testar agora:   ./test-block.sh"
echo "============================================================"
