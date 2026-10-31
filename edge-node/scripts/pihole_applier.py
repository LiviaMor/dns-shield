#!/usr/bin/env python3
"""DNS Shield — Pi-hole Applier (Edge).

Aplica um PERFIL de proteção (ex.: controle parental) no Pi-hole real, usando a
API v6. É o par do pihole_reporter.py: enquanto o reporter LÊ os bloqueios para
o painel, o applier ESCREVE a política no Pi-hole.

O que aplica, a partir do perfil JSON:
    1. adlists de categoria  -> POST /api/lists  (ex.: adult-content, gambling)
    2. SafeSearch            -> escreve /etc/dnsmasq.d/05-safesearch.conf (CNAME)
    3. recompila as listas   -> POST /api/action/gravity  (equivale a `pihole -g`)

Uso (local, sem Pi-hole real):
    python3 pihole_applier.py --dry-run
    python3 pihole_applier.py --simulate            # imprime o que faria

Uso (no Pi, de verdade):
    PIHOLE_URL=http://127.0.0.1 PIHOLE_PASSWORD=sua-senha \\
    python3 pihole_applier.py --profile familia-controle-parental

Privacidade: tudo roda localmente no dispositivo; nada é enviado para fora.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

# Caminho padrão do perfil versionado na base de conhecimento do repo.
DEFAULT_PROFILE_DIR = (
    Path(__file__).resolve().parents[2] / "knowledge-base" / "profiles"
)
# Onde o Pi-hole (dnsmasq/FTL) lê configs extras. No container oficial é este.
SAFESEARCH_CONF_PATH = os.environ.get(
    "SAFESEARCH_CONF_PATH", "/etc/dnsmasq.d/05-safesearch.conf"
)


# --------------------------------------------------------------------------- #
# HTTP helper (stdlib apenas — sem dependências, ideal para o Pi)
# --------------------------------------------------------------------------- #
def _request(
    url: str,
    method: str = "GET",
    body: Optional[dict] = None,
    headers: Optional[dict] = None,
    timeout: int = 20,
) -> Any:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def pihole_auth(base: str, password: str) -> str:
    """Autentica na API v6 do Pi-hole e devolve o SID da sessão."""
    out = _request(f"{base}/api/auth", method="POST", body={"password": password})
    sid = out.get("session", {}).get("sid")
    if not sid:
        raise RuntimeError("Pi-hole não retornou SID (senha incorreta?).")
    return sid


# --------------------------------------------------------------------------- #
# Perfil
# --------------------------------------------------------------------------- #
def load_profile(profile_id: str, profile_dir: Path) -> dict:
    path = profile_dir / f"{profile_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Perfil não encontrado: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def safesearch_conf(profile: dict) -> str:
    """Gera o conteúdo do arquivo dnsmasq de SafeSearch a partir do perfil."""
    ss = profile.get("safeSearch", {})
    if not ss.get("ativo"):
        return ""
    lines = [
        "# DNS Shield — SafeSearch (gerado automaticamente a partir do perfil).",
        f"# Perfil: {profile.get('id', '?')}",
        "# Reescreve buscadores/YouTube para os domínios de modo seguro.",
    ]
    for host, target in ss.get("cnames", {}).items():
        lines.append(f"cname={host},{target}")
    return "\n".join(lines) + "\n"


# --------------------------------------------------------------------------- #
# Aplicação
# --------------------------------------------------------------------------- #
def apply_adlists(base: str, sid: str, blocklists: list[str], dry_run: bool) -> int:
    applied = 0
    for url in blocklists:
        if dry_run:
            print(f"[dry-run] POST /api/lists  address={url} type=block")
            applied += 1
            continue
        try:
            _request(
                f"{base}/api/lists",
                method="POST",
                body={"address": url, "type": "block", "comment": "dns-shield:parental"},
                headers={"sid": sid},
            )
            print(f"[applier] adlist adicionada: {url}", file=sys.stderr)
            applied += 1
        except urllib.error.HTTPError as exc:
            # 409 = já existe; tratamos como sucesso idempotente.
            if exc.code == 409:
                print(f"[applier] adlist já existia (ok): {url}", file=sys.stderr)
                applied += 1
            else:
                print(f"[applier] falha na adlist {url}: HTTP {exc.code}", file=sys.stderr)
    return applied


def write_safesearch(conf: str, dry_run: bool) -> bool:
    if not conf:
        print("[applier] SafeSearch inativo no perfil — nada a escrever.", file=sys.stderr)
        return False
    if dry_run:
        print(f"[dry-run] escreveria {SAFESEARCH_CONF_PATH} com:")
        print("--- 8< ---")
        print(conf, end="")
        print("--- >8 ---")
        return True
    try:
        Path(SAFESEARCH_CONF_PATH).write_text(conf, encoding="utf-8")
        print(f"[applier] SafeSearch escrito em {SAFESEARCH_CONF_PATH}", file=sys.stderr)
        return True
    except OSError as exc:
        print(f"[applier] não consegui escrever SafeSearch: {exc}", file=sys.stderr)
        return False


def run_gravity(base: str, sid: str, dry_run: bool) -> None:
    if dry_run:
        print("[dry-run] POST /api/action/gravity  (recompila as listas)")
        return
    try:
        _request(f"{base}/api/action/gravity", method="POST", headers={"sid": sid})
        print("[applier] gravity recompilado — listas ativas.", file=sys.stderr)
    except urllib.error.URLError as exc:
        print(f"[applier] falha ao rodar gravity: {exc}", file=sys.stderr)


def apply_profile(profile: dict, base: str, password: str, dry_run: bool) -> dict:
    blocklists = profile.get("blocklists", [])
    conf = safesearch_conf(profile)

    sid = ""
    if not dry_run:
        sid = pihole_auth(base, password)

    adlists_applied = apply_adlists(base, sid, blocklists, dry_run)
    safesearch_applied = write_safesearch(conf, dry_run)
    run_gravity(base, sid, dry_run)

    summary = {
        "profile": profile.get("id"),
        "categoriasBloqueadas": profile.get("categoriasBloqueadas", []),
        "adlistsApplied": adlists_applied,
        "safeSearchApplied": safesearch_applied,
        "dryRun": dry_run,
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main() -> int:
    parser = argparse.ArgumentParser(
        description="DNS Shield — aplica um perfil de proteção no Pi-hole."
    )
    parser.add_argument(
        "--profile",
        default="familia-controle-parental",
        help="ID do perfil (arquivo .json em knowledge-base/profiles).",
    )
    parser.add_argument(
        "--profile-dir",
        type=Path,
        default=DEFAULT_PROFILE_DIR,
        help="Diretório dos perfis.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Não altera nada: só imprime o que seria aplicado.",
    )
    parser.add_argument(
        "--simulate",
        action="store_true",
        help="Alias de --dry-run (não requer Pi-hole nem rede).",
    )
    args = parser.parse_args()

    dry_run = args.dry_run or args.simulate or os.environ.get("DRY_RUN") == "true"

    base = os.environ.get("PIHOLE_URL", "http://127.0.0.1").rstrip("/")
    password = os.environ.get("PIHOLE_PASSWORD", "")

    try:
        profile = load_profile(args.profile, args.profile_dir)
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        print(f"[applier] erro ao carregar o perfil: {exc}", file=sys.stderr)
        return 1

    if not dry_run and not password:
        print(
            "[applier] PIHOLE_PASSWORD não definido. Use --dry-run para testar "
            "sem um Pi-hole real, ou defina a senha.",
            file=sys.stderr,
        )
        return 1

    try:
        apply_profile(profile, base, password, dry_run)
    except (urllib.error.URLError, RuntimeError, OSError) as exc:
        print(f"[applier] falha ao aplicar o perfil: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
