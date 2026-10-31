#!/usr/bin/env bash
# DNS Shield — mostra como apontar o DNS para o Pi-hole local (e como reverter).
# Detecta o sistema e imprime os comandos exatos.
set -euo pipefail

OS="$(uname -s)"

echo "============================================================"
echo " Apontar o DNS para o Pi-hole local (127.0.0.1)"
echo "============================================================"
echo
echo "Use 127.0.0.1 para proteger ESTE computador."
echo "Para proteger a REDE TODA, use no roteador o IP deste PC na LAN"
echo "(descubra com:  ipconfig getifaddr en0  no Mac)."
echo

case "$OS" in
  Darwin)
    echo "### macOS ###"
    echo
    echo "Ativar (proteger este Mac):"
    echo "   sudo networksetup -setdnsservers Wi-Fi 127.0.0.1"
    echo
    echo "Reverter (voltar ao normal / DNS automático):"
    echo "   sudo networksetup -setdnsservers Wi-Fi Empty"
    echo
    echo "Dica: troque 'Wi-Fi' por 'Ethernet' se usar cabo."
    echo "Ver serviços de rede:  networksetup -listallnetworkservices"
    ;;
  Linux)
    echo "### Linux ###"
    echo
    echo "Opção rápida (temporária, até reiniciar):"
    echo "   echo 'nameserver 127.0.0.1' | sudo tee /etc/resolv.conf"
    echo
    echo "Reverter:"
    echo "   sudo systemctl restart systemd-resolved   # ou restaure seu resolv.conf"
    echo
    echo "Com NetworkManager (persistente):"
    echo "   nmcli con mod <conexao> ipv4.dns 127.0.0.1"
    echo "   nmcli con mod <conexao> ipv4.ignore-auto-dns yes"
    echo "   nmcli con up <conexao>"
    ;;
  *)
    echo "### Windows (PowerShell como Administrador) ###"
    echo
    echo "Veja connect.ps1 nesta pasta para os comandos do Windows."
    ;;
esac

echo
echo "------------------------------------------------------------"
echo "Depois de apontar o DNS, limpe o cache e teste:"
echo "   - abra o YouTube ou um site com anúncios"
echo "   - veja os bloqueios em tempo real: http://localhost:8090/admin"
echo "------------------------------------------------------------"
echo "LEMBRE DE REVERTER o DNS quando terminar o teste."
