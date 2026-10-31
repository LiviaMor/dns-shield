# DNS Shield — Gateway de Segurança DNS Plug-and-Play

> Solução **open source** de proteção de rede na camada de DNS, focada em conformidade com a **LGPD** e defesa contra **ransomware** para clínicas odontológicas e médicas.
>
> **Plug-and-play:** conecte o dispositivo e funcione — sem nuvem obrigatória, sem custo de infraestrutura. Escala para a nuvem quando você precisar atender muitas clínicas.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MLH Hackathon](https://img.shields.io/badge/MLH-Hackathon-blue.svg)](https://mlh.io/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-brightgreen.svg)](#contribuindo)

---

## 1. Visão Geral do Produto

Um **Gateway de Segurança DNS "Plug-and-Play"** que opera como serviço gerenciado (MSSP), interceptando ameaças na camada de rede antes que cheguem aos computadores da recepção.

- **Proposta de Valor:** blindagem operacional com atrito zero. O cliente não gerencia painéis de TI — ele assina a tranquilidade de não ter a agenda paralisada por vazamento de dados.
- **Plug-and-play:** conecte o Raspberry Pi ao roteador e pronto. O MVP roda 100% local, sem depender de nuvem paga.
- **Open source:** todo o código é MIT. Qualquer pessoa pode auditar, rodar e contribuir.

## 2. Filosofia: local primeiro, nuvem opcional

O DNS Shield foi desenhado para **funcionar completo sem nuvem** e **escalar para a nuvem sem reescrever código**. A persistência e a mensageria ficam atrás de contratos simples, então trocar o backing store é configuração — não refatoração.

| Camada | MVP — plug-and-play (grátis, local) | Escala — nuvem (opcional) |
|---|---|---|
| Persistência | **SQLite** (um arquivo, zero config) | Postgres / DynamoDB (mesmo contrato chave-valor) |
| Onboarding | tabela **outbox** no próprio banco | Redis / SQS / RabbitMQ drenando a outbox |
| IA de perfis | **heurística local** offline | LLM open source (Ollama) ou API |
| Deploy | **Docker Compose** no Raspberry Pi | Kubernetes / serverless |
| Custo | **R$ 0** | sob demanda, só quando escalar |

> O mesmo backend NestJS roda nos dois cenários. Você começa grátis e sobe para a nuvem apenas quando o volume de clínicas justificar.

## 3. Arquitetura (Edge + Cloud opcional)

```
┌─────────────────────── CLÍNICA (Edge — obrigatório) ─────────────┐
│  Raspberry Pi 2 (ARMv7)                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐      │
│  │   Pi-hole    │   │ pboehm/ddns  │   │ network_discovery│      │
│  │ DNS + DHCP   │   │  IP dinâmico │   │   (nmap/arp)     │      │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘      │
└─────────┼──────────────────┼────────────────────┼────────────────┘
          │ bloqueio local   │ túnel DDNS          │ topologia
          ▼                  ▼                     ▼
┌─────────── BACKEND (local no Pi OU na nuvem — mesmo código) ──────┐
│  API NestJS  ──▶  SQLite (local)  ──ou──▶  Postgres (nuvem)       │
│       │                                                           │
│       ├──▶ Analyzer (heurística local)  ──ou──▶  LLM (opcional)   │
│       └──▶ Outbox  ──▶  WhatsApp (instruções ao gestor)           │
└────────────────────────────────────────────────────────────────── ┘
```

### Edge (Raspberry Pi 2 — ARMv7) — o coração plug-and-play
- **Pi-hole:** servidor DNS **e** DHCP (substitui o DHCP travado do modem da operadora), filtrando o tráfego localmente.
- **pboehm/ddns:** container que mantém o IP dinâmico atualizado, garantindo acesso remoto seguro.
- **Network Scanner:** `network_discovery.py` varre a rede, descobre o gateway e classifica dispositivos.

### Backend (NestJS) — roda no Pi ou na nuvem
- **API multi-tenant:** isola os dados de cada clínica (escopo por `X-Tenant-Id`).
- **Analyzer:** separa estações de trabalho de dispositivos IoT (câmeras, Smart TVs) e sugere um IP estático livre para o gateway. Heurístico por padrão; plugável a um LLM.
- **Onboarding (outbox → WhatsApp):** registra o passo a passo para o gestor desativar o DHCP do roteador principal.

## 4. Fluxo de Onboarding (Experiência do Cliente)

1. **Física:** a recepção conecta o Raspberry Pi ao roteador (rede + energia).
2. **Descoberta:** o container sobe, executa `network_discovery.py` e envia a topologia para o backend.
3. **Decisão:** o Analyzer separa computadores de Smart TVs e aloca um IP estático livre para o gateway.
4. **Comunicação:** o sistema registra um WhatsApp automatizado: *"Equipamento online. Para ativar a segurança LGPD, desative o DHCP do seu roteador seguindo estas 3 telas..."*

## 5. Estrutura do Repositório

```
dns-shield/
├── edge-node/                  # Infra local da clínica (roda no Raspberry Pi)
│   ├── docker-compose.yml      # Pi-hole (host/DHCP) + DDNS, enxuto para RAM do Pi 2
│   ├── .env.example            # Variáveis de ambiente, tokens de DDNS
│   └── scripts/
│       └── network_discovery.py
├── cloud-backend/              # API NestJS multi-tenant (SQLite local → Postgres na nuvem)
│   ├── src/
│   │   ├── common/             # DbService (SQLite) + decorator multi-tenant
│   │   ├── topology/           # ingestão da topologia + Analyzer
│   │   ├── onboarding/         # outbox → WhatsApp
│   │   └── reports/            # relatórios de ameaças por clínica
│   └── .env.example
└── docs/
    └── arquitetura.md
```

## 6. Quick Start

### 6.1 Edge (na clínica)

```bash
cd edge-node
cp .env.example .env            # preencha WEBPASSWORD e DDNS_URL
docker compose up -d
```

> **`network_mode: host`** é o que permite o DHCP funcionar — o Pi-hole precisa enxergar os dispositivos reais da rede.
> **`NET_ADMIN`** é a capability de kernel obrigatória para distribuir IPs.

Varredura da rede e envio ao backend:

```bash
sudo TENANT_ID=clinica-centro CLOUD_API_URL=http://localhost:3000/api \
  python3 edge-node/scripts/network_discovery.py --send
```

### 6.2 Backend (local, grátis)

```bash
cd cloud-backend
cp .env.example .env
npm install
npm run start:dev               # sobe em http://localhost:3000
```

Teste rápido:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","service":"dns-shield-cloud-backend"}
```

## 7. API (resumo)

Todas as rotas exigem o header `X-Tenant-Id` (isolamento multi-tenant), exceto `/health`.

| Método | Rota | Descrição |
|---|---|---|
| `GET`  | `/api/health` | Health check |
| `POST` | `/api/topology` | Ingere a topologia descoberta no Edge; retorna o plano de segurança |
| `GET`  | `/api/topology` | Histórico de varreduras da clínica |
| `GET`  | `/api/reports/latest` | Último relatório de ameaças bloqueadas |
| `POST` | `/api/reports` | Salva um relatório puxado do Pi-hole |

## 8. Escalando para a nuvem (quando precisar)

Nada disso é necessário para o MVP. Quando o número de clínicas crescer:

1. **Banco:** troque `DbService` (SQLite) por um adaptador Postgres — o contrato `put`/`queryByPrefix` é o mesmo.
2. **Onboarding:** adicione um worker que drena a tabela `OUTBOX#` para uma fila (Redis/SQS) e entrega via WhatsApp.
3. **IA:** aponte `LLM_API_URL` para um Ollama self-host (open source) e refine a classificação no `AnalyzerService`.
4. **Deploy:** empacote o mesmo backend em container e suba em Kubernetes/serverless.

## 9. Contribuindo

Projeto open source sob licença MIT — contribuições são bem-vindas (Hacktoberfest-friendly 🎃).

1. Faça um fork e crie uma branch (`git checkout -b feature/minha-ideia`).
2. Rode o build/testes do backend (`cd cloud-backend && npm run build`).
3. Abra um Pull Request descrevendo a mudança.

## 10. Licença

[MIT](LICENSE) — use, modifique e distribua livremente.
