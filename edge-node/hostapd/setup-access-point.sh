#!/usr/bin/env bash
# DNS Shield — Setup do Access Point no Raspberry Pi (roda UMA vez no provisionamento).
#
# Transforma o Pi num roteador Wi-Fi plug-and-play:
#   - eth0  = uplink (cabo até o modem da operadora)
#   - wlan0 = rede Wi-Fi "DNS-Shield" criada pelo próprio Pi
#
# O resultado: dispositivos conectam no Wi-Fi do Pi e recebem o Pi-hole como DNS
# automaticamente (via DHCP), SEM ninguém mexer no modem.
#
# ATENÇÃO: este script é para o Raspberry Pi real (Linux/ARM). Não roda na
# simulação em Docker (não há rádio Wi-Fi para o hostapd controlar).
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root: sudo $0" >&2
  exit 1
fi

WLAN_IFACE="${WLAN_IFACE:-wlan0}"
UPLINK_IFACE="${UPLINK_IFACE:-eth0}"
AP_IP="${AP_IP:-192.168.50.1}"
AP_SUBNET="${AP_SUBNET:-192.168.50.0/24}"

echo "==> Instalando hostapd e dnsmasq..."
apt-get update -y
apt-get install -y hostapd dnsmasq

echo "==> Configurando IP estático em ${WLAN_IFACE} (${AP_IP})..."
cat >/etc/systemd/network/10-dns-shield-ap.network <<EOF
[Match]
Name=${WLAN_IFACE}

[Network]
Address=${AP_IP}/24
EOF

echo "==> Instalando a configuração do hostapd..."
install -m 600 "$(dirname "$0")/hostapd.conf" /etc/hostapd/hostapd.conf
sed -i 's|^#\?DAEMON_CONF=.*|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd || true

echo "==> Habilitando o encaminhamento (NAT) de ${WLAN_IFACE} -> ${UPLINK_IFACE}..."
echo 'net.ipv4.ip_forward=1' >/etc/sysctl.d/99-dns-shield.conf
sysctl -w net.ipv4.ip_forward=1
# NAT: traduz a rede Wi-Fi para a internet via uplink.
iptables -t nat -C POSTROUTING -o "${UPLINK_IFACE}" -j MASQUERADE 2>/dev/null \
  || iptables -t nat -A POSTROUTING -o "${UPLINK_IFACE}" -j MASQUERADE
# Persiste as regras (netfilter-persistent, se disponível).
command -v netfilter-persistent >/dev/null 2>&1 && netfilter-persistent save || true

echo "==> Habilitando os serviços..."
systemctl unmask hostapd || true
systemctl enable hostapd
systemctl restart systemd-networkd || true
systemctl restart hostapd

cat <<EOF

================================================================
 Access Point "DNS-Shield" ativo em ${WLAN_IFACE} (${AP_IP}).
 O serviço de DHCP/DNS é fornecido pelo Pi-hole (container Docker),
 configurado para a sub-rede ${AP_SUBNET}.

 Próximo passo: suba os containers ->  docker compose up -d
 Depois, conecte um celular no Wi-Fi "DNS-Shield" e teste.
================================================================
EOF
