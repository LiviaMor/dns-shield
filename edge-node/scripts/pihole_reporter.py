#!/usr/bin/env python3
"""DNS Shield — Pi-hole Reporter (Edge).

Lê as estatísticas REAIS do Pi-hole (API v6), monta um relatório de ameaças
bloqueadas e envia ao backend (POST /api/reports). É a ponte que faz o bloqueio
do Pi-hole aparecer no painel do cliente.

Fluxo:
    1. autentica na API do Pi-hole (POST /api/auth com a senha)   -> obtém SID
    2. GET /api/stats/summary        -> total, bloqueadas, taxa
    3. GET /api/stats/top_domains    -> top domínios bloqueados
    4. POST {backend}/api/reports    -> grava o relatório (escopo por tenant)

Uso:
    PIHOLE_URL=http://127.0.0.1 PIHOLE_PASSWORD=sua-senha \\
    CLOUD_API_URL=http://localhost:3000/api TENANT_ID=clinica-demo \\
    python3 pihole_reporter.py
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta
from typing import Any, Optional


def _request(
    url: str,
    method: str = "GET",
    body: Optional[dict] = None,
    headers: Optional[dict] = None,
    timeout: int = 15,
) -> Any:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        url, data=data, headers=headers or {}, method=method
    )
    if body is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def pihole_auth(base: str, password: str) -> str:
    """Autentica e devolve o SID da sessão."""
    out = _request(f"{base}/api/auth", method="POST", body={"password": password})
    sid = out.get("session", {}).get("sid")
    if not sid:
        raise RuntimeError("Pi-hole não retornou SID (senha incorreta?).")
    return sid


def fetch_summary(base: str, sid: str) -> dict:
    return _request(f"{base}/api/stats/summary", headers={"sid": sid})


def fetch_top_blocked(base: str, sid: str, count: int = 5) -> list[dict]:
    out = _request(
        f"{base}/api/stats/top_domains?blocked=true&count={count}",
        headers={"sid": sid},
    )
    return out.get("domains", [])


def build_report(summary: dict, top_blocked: list[dict]) -> dict:
    q = summary.get("queries", {})
    now = datetime.now(timezone.utc)
    return {
        "periodStart": (now - timedelta(hours=24)).isoformat(),
        "periodEnd": now.isoformat(),
        "totalQueries": int(q.get("total", 0)),
        "blockedQueries": int(q.get("blocked", 0)),
        "blockRatePct": round(float(q.get("percent_blocked", 0.0)), 1),
        "topBlockedDomains": [
            {"domain": d.get("domain", "?"), "hits": int(d.get("count", 0))}
            for d in top_blocked
        ],
    }


def send_report(api_base: str, tenant: str, report: dict, retries: int = 10) -> None:
    url = api_base.rstrip("/") + "/reports"
    data = report
    for attempt in range(1, retries + 1):
        try:
            _request(
                url,
                method="POST",
                body=data,
                headers={"X-Tenant-Id": tenant},
            )
            print(f"[reporter] relatório enviado -> {url} (tenant={tenant})",
                  file=sys.stderr)
            return
        except (urllib.error.URLError, OSError) as exc:
            print(f"[reporter] tentativa {attempt}/{retries} falhou: {exc}",
                  file=sys.stderr)
            if attempt < retries:
                time.sleep(3)
    print("[reporter] desistindo após esgotar as tentativas.", file=sys.stderr)


def run_once() -> dict:
    pihole_url = os.environ.get("PIHOLE_URL", "http://127.0.0.1").rstrip("/")
    password = os.environ.get("PIHOLE_PASSWORD", "")
    api_base = os.environ.get("CLOUD_API_URL", "http://localhost:3000/api")
    tenant = os.environ.get("TENANT_ID", "unknown-tenant")

    sid = pihole_auth(pihole_url, password)
    summary = fetch_summary(pihole_url, sid)
    top_blocked = fetch_top_blocked(pihole_url, sid)
    report = build_report(summary, top_blocked)

    print(json.dumps(report, indent=2, ensure_ascii=False))
    send_report(api_base, tenant, report)
    return report


def main() -> int:
    interval = int(os.environ.get("REPORT_INTERVAL", "0"))
    if interval <= 0:
        run_once()
        return 0
    # Modo daemon: reporta periodicamente (uso em produção no Pi).
    print(f"[reporter] modo contínuo, a cada {interval}s", file=sys.stderr)
    while True:
        try:
            run_once()
        except Exception as exc:  # noqa: BLE001
            print(f"[reporter] erro no ciclo: {exc}", file=sys.stderr)
        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
