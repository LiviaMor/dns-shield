#!/usr/bin/env bash
# DNS Shield — prova o bloqueio SEM precisar mudar o DNS do PC.
# Consulta direto o Pi-hole local e mostra anúncio bloqueado vs. site normal.
set -euo pipefail
cd "$(dirname "$0")"

echo "=== Testando o bloqueio direto no Pi-hole local ==="
echo
echo "1) Site normal (deve resolver um IP real):"
printf "   github.com      -> "
docker exec dns-shield-local dig +short @127.0.0.1 github.com | head -1
echo
echo "2) Domínios de ANÚNCIO/RASTREIO (devem retornar 0.0.0.0 = BLOQUEADO):"
for d in doubleclick.net ads.google.com googlesyndication.com google-analytics.com; do
  printf "   %-26s -> " "$d"
  res="$(docker exec dns-shield-local dig +short @127.0.0.1 "$d" | head -1)"
  if [ "$res" = "0.0.0.0" ] || [ -z "$res" ]; then
    echo "🛑 BLOQUEADO"
  else
    echo "$res"
  fi
done
echo
echo "Se os anúncios mostram 🛑 BLOQUEADO, o Pi-hole está funcionando."
echo "Para proteger o navegador de verdade (YouTube etc.), rode ./connect.sh"
