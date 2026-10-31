#!/usr/bin/env python3
"""DNS Shield — Network Discovery (Edge).

Varre a rede local da clínica, identifica hosts ativos e o gateway, classifica
dispositivos de forma heurística (PC vs. IoT) e envia a topologia para a API do
backend (NestJS), que gera o plano de segurança localmente.

Projetado para rodar em um Raspberry Pi 2 (ARMv7), sem dependências pesadas:
usa `nmap`/`arp-scan` quando disponíveis e cai para um scan ARP em Python puro.

Uso:
    sudo python3 network_discovery.py                 # descobre e imprime
    sudo python3 network_discovery.py --send          # descobre e envia à nuvem
    sudo python3 network_discovery.py --cidr 192.168.1.0/24
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Optional

# Prefixos OUI (3 primeiros octetos do MAC) usados como heurística de fabricante.
# Não é exaustivo — serve de dica inicial para a classificação local.
OUI_HINTS: dict[str, str] = {
    "B8:27:EB": "Raspberry Pi",
    "DC:A6:32": "Raspberry Pi",
    "E4:5F:01": "Raspberry Pi",
    "00:1A:11": "Google",
    "F4:F5:D8": "Google/Nest",
    "18:B4:30": "Nest",
    "D0:03:4B": "Apple",
    "AC:BC:32": "Apple",
    "00:11:32": "Synology",
    "00:1D:C1": "Camera/IoT",
    "C8:3A:35": "Tenda/IoT",
}

# Portas que ajudam a inferir o tipo de dispositivo.
DEVICE_PORT_HINTS: dict[int, str] = {
    80: "web-ui",
    443: "web-ui",
    554: "camera-rtsp",
    631: "printer",
    9100: "printer",
    445: "windows-pc",
    139: "windows-pc",
    22: "server",
    5353: "iot-mdns",
}


@dataclass
class Device:
    ip: str
    mac: Optional[str] = None
    hostname: Optional[str] = None
    vendor_hint: Optional[str] = None
    open_ports: list[int] = field(default_factory=list)
    classification: str = "unknown"
    is_gateway: bool = False


@dataclass
class Topology:
    tenant_id: str
    gateway: Optional[str]
    cidr: str
    scanned_at: str
    devices: list[Device]

    def to_json(self) -> str:
        payload = asdict(self)
        return json.dumps(payload, indent=2, ensure_ascii=False)


def _run(cmd: list[str], timeout: int = 120) -> str:
    """Executa um comando e devolve stdout (string vazia em caso de erro)."""
    try:
        out = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        return out.stdout or ""
    except (subprocess.SubprocessError, OSError):
        return ""


def detect_cidr() -> str:
    """Descobre o CIDR da interface principal (fallback 192.168.1.0/24)."""
    # Tenta via `ip route` (Linux). No Pi é o caminho normal.
    route = _run(["ip", "-o", "-f", "inet", "addr", "show"])
    for line in route.splitlines():
        m = re.search(r"inet (\d+\.\d+\.\d+\.\d+/\d+)", line)
        if m and not line.strip().startswith("1: lo"):
            net = ipaddress.ip_network(m.group(1), strict=False)
            if not net.is_loopback:
                return str(net)
    return "192.168.1.0/24"


def detect_gateway() -> Optional[str]:
    """Descobre o IP do gateway padrão."""
    out = _run(["ip", "route", "show", "default"])
    m = re.search(r"default via (\d+\.\d+\.\d+\.\d+)", out)
    if m:
        return m.group(1)
    # Fallback: assume .1 da rede local.
    return None


def resolve_hostname(ip: str) -> Optional[str]:
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, socket.gaierror, OSError):
        return None


def vendor_from_mac(mac: Optional[str]) -> Optional[str]:
    if not mac:
        return None
    prefix = mac.upper()[:8]
    return OUI_HINTS.get(prefix)


def classify(dev: Device) -> str:
    """Heurística simples de classificação local de dispositivo."""
    if dev.is_gateway:
        return "gateway/router"
    vendor = (dev.vendor_hint or "").lower()
    if "raspberry" in vendor:
        return "edge-node"
    if "camera" in vendor or 554 in dev.open_ports:
        return "iot-camera"
    if 9100 in dev.open_ports or 631 in dev.open_ports:
        return "printer"
    if 445 in dev.open_ports or 139 in dev.open_ports:
        return "workstation-pc"
    if "apple" in vendor:
        return "endpoint-apple"
    if any(p in dev.open_ports for p in (5353,)) or "nest" in vendor or "google" in vendor:
        return "iot-generic"
    return "unknown"


def scan_with_nmap(cidr: str) -> list[Device]:
    """Scan via nmap (-sn para descoberta + -F para portas comuns)."""
    xml = _run(["nmap", "-sn", cidr])
    devices: dict[str, Device] = {}
    current_ip: Optional[str] = None
    for line in xml.splitlines():
        ip_m = re.search(r"Nmap scan report for .*?(\d+\.\d+\.\d+\.\d+)", line)
        if ip_m:
            current_ip = ip_m.group(1)
            devices[current_ip] = Device(ip=current_ip)
        mac_m = re.search(r"MAC Address: ([0-9A-Fa-f:]{17})(?: \((.*)\))?", line)
        if mac_m and current_ip:
            devices[current_ip].mac = mac_m.group(1).upper()
            devices[current_ip].vendor_hint = mac_m.group(2) or None
    return list(devices.values())


def scan_with_arp_scan(cidr: str) -> list[Device]:
    """Scan via arp-scan (rápido e leve, ideal para o Pi)."""
    out = _run(["arp-scan", "--localnet", "--quiet"]) or _run(["arp-scan", cidr])
    devices: list[Device] = []
    for line in out.splitlines():
        m = re.match(r"(\d+\.\d+\.\d+\.\d+)\s+([0-9A-Fa-f:]{17})\s*(.*)", line)
        if m:
            devices.append(
                Device(
                    ip=m.group(1),
                    mac=m.group(2).upper(),
                    vendor_hint=(m.group(3).strip() or None),
                )
            )
    return devices


def scan_with_arp_table(cidr: str) -> list[Device]:
    """Fallback puro: faz ping-sweep leve e lê a tabela ARP do SO."""
    net = ipaddress.ip_network(cidr, strict=False)
    hosts = list(net.hosts())[:254]
    for host in hosts:
        # Ping único e rápido só para popular a tabela ARP.
        subprocess.run(
            ["ping", "-c", "1", "-W", "1", str(host)],
            capture_output=True,
            check=False,
        )
    arp = _run(["arp", "-a"]) or _run(["ip", "neigh"])
    devices: list[Device] = []
    for line in arp.splitlines():
        ip_m = re.search(r"(\d+\.\d+\.\d+\.\d+)", line)
        mac_m = re.search(r"([0-9A-Fa-f]{1,2}(?::[0-9A-Fa-f]{1,2}){5})", line)
        if not ip_m:
            continue
        ip = ip_m.group(1)
        # Respeita o CIDR alvo e ignora broadcast/entradas incompletas.
        if ipaddress.ip_address(ip) not in net:
            continue
        mac = mac_m.group(1).upper() if mac_m else None
        if not mac or len(mac) != 17 or mac == "FF:FF:FF:FF:FF:FF":
            continue
        devices.append(Device(ip=ip, mac=_normalize_mac(mac)))
    return devices


def _normalize_mac(mac: str) -> str:
    """Normaliza para AA:BB:CC:DD:EE:FF (octetos com 2 dígitos, maiúsculos)."""
    parts = mac.split(":")
    return ":".join(p.upper().zfill(2) for p in parts)


def simulated_topology() -> list[Device]:
    """Topologia fictícia de uma clínica, para demos sem acesso à LAN física.

    Reproduz o cenário típico: roteador da operadora, PCs da recepção,
    impressora, câmera IoT e uma Smart TV — exatamente os dispositivos que o
    Analyzer precisa separar em perfis de segurança.
    """
    return [
        Device(ip="192.168.1.1", mac="C8:3A:35:00:00:01",
               hostname="router-vivo", vendor_hint="Tenda/IoT", is_gateway=True),
        Device(ip="192.168.1.10", mac="AC:BC:32:00:00:10",
               hostname="recepcao-pc", vendor_hint="Apple", open_ports=[445, 139]),
        Device(ip="192.168.1.11", mac="AC:BC:32:00:00:11",
               hostname="dentista-pc", vendor_hint="Apple", open_ports=[445]),
        Device(ip="192.168.1.50", mac="00:11:32:00:00:50",
               hostname="nas-backup", vendor_hint="Synology", open_ports=[22, 445]),
        Device(ip="192.168.1.80", mac="00:1D:C1:00:00:80",
               hostname="camera-entrada", vendor_hint="Camera/IoT", open_ports=[554, 80]),
        Device(ip="192.168.1.90", mac="F4:F5:D8:00:00:90",
               hostname="smart-tv-sala", vendor_hint="Google/Nest", open_ports=[8008, 5353]),
        Device(ip="192.168.1.120", mac="00:11:32:00:01:20",
               hostname="impressora-hp", vendor_hint=None, open_ports=[9100, 631]),
    ]


def discover(cidr: Optional[str], gateway: Optional[str],
             simulate: bool = False) -> Topology:
    cidr = cidr or detect_cidr()
    gateway = gateway or detect_gateway()

    if simulate:
        devices = simulated_topology()
        gateway = gateway or "192.168.1.1"
        cidr = "192.168.1.0/24"
        tool = "simulate"
    elif shutil.which("nmap"):
        devices = scan_with_nmap(cidr)
        tool = "nmap"
    elif shutil.which("arp-scan"):
        devices = scan_with_arp_scan(cidr)
        tool = "arp-scan"
    else:
        devices = scan_with_arp_table(cidr)
        tool = "arp-table"

    print(f"[discovery] ferramenta: {tool} | cidr: {cidr} | hosts: {len(devices)}",
          file=sys.stderr)

    for dev in devices:
        if gateway and dev.ip == gateway:
            dev.is_gateway = True
        if dev.hostname is None:
            dev.hostname = resolve_hostname(dev.ip)
        if dev.vendor_hint is None:
            dev.vendor_hint = vendor_from_mac(dev.mac)
        dev.classification = classify(dev)

    return Topology(
        tenant_id=os.environ.get("TENANT_ID", "unknown-tenant"),
        gateway=gateway,
        cidr=cidr,
        scanned_at=datetime.now(timezone.utc).isoformat(),
        devices=devices,
    )


def send_to_cloud(topology: Topology) -> None:
    base = os.environ.get("CLOUD_API_URL")
    if not base:
        print("[send] CLOUD_API_URL não definido — pulando envio.", file=sys.stderr)
        return
    url = base.rstrip("/") + "/topology"
    data = topology.to_json().encode("utf-8")
    attempts = int(os.environ.get("SEND_RETRIES", "10"))
    for attempt in range(1, attempts + 1):
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "X-Tenant-Id": topology.tenant_id,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
                body = resp.read().decode("utf-8")
                print(f"[send] enviado -> {url} ({resp.status})", file=sys.stderr)
                print(body)
                return
        except Exception as exc:  # noqa: BLE001
            print(f"[send] tentativa {attempt}/{attempts} falhou: {exc}",
                  file=sys.stderr)
            if attempt < attempts:
                time.sleep(3)
    print("[send] desistindo após esgotar as tentativas.", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description="DNS Shield — descoberta de rede local")
    parser.add_argument("--cidr", help="CIDR a varrer (ex.: 192.168.1.0/24)")
    parser.add_argument("--gateway", help="IP do gateway (detectado se omitido)")
    parser.add_argument("--send", action="store_true",
                        help="Envia a topologia para a API do backend")
    parser.add_argument("--simulate", action="store_true",
                        help="Usa uma topologia fictícia de clínica (demo sem LAN)")
    args = parser.parse_args()

    simulate = args.simulate or os.environ.get("SIMULATE") == "true"
    topology = discover(args.cidr, args.gateway, simulate=simulate)
    print(topology.to_json())

    if args.send or os.environ.get("SEND") == "true":
        send_to_cloud(topology)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
