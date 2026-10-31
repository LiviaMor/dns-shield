# DNS Shield — Gateway de Segurança DNS Plug-and-Play

> Solução **open source** de proteção de rede na camada de DNS, focada em privacidade, conformidade com a **LGPD** e defesa contra **ransomware e phishing**.
>
> **Para todos:** do consumidor final (casa, família, home office) à pequena empresa e ao mercado B2B/MSSP (clínicas, escritórios, comércio).
>
> **Plug-and-play:** conecte o dispositivo e funcione — sem nuvem obrigatória, sem custo de infraestrutura. Escala para a nuvem quando você precisar gerenciar muitos sites.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MLH Hackathon](https://img.shields.io/badge/MLH-Hackathon-blue.svg)](https://mlh.io/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-brightgreen.svg)](#contribuindo)

---

## 1. Visão Geral do Produto

Um **Gateway de Segurança DNS "Plug-and-Play"** que intercepta ameaças na camada de rede antes que cheguem aos dispositivos — bloqueando phishing, malware, rastreadores e telemetria indesejada para **qualquer rede**.

- **Dois públicos, o mesmo produto:**
  - **Consumidor (B2C):** proteção e privacidade para a casa inteira (TVs, celulares, consoles, IoT) com instalação sem atrito — sem instalar app em cada aparelho. Bloqueio de anúncios, rastreadores e sites maliciosos para a família toda.
  - **Empresa / MSSP (B2B):** blindagem operacional gerenciada para clínicas, escritórios e comércio, com relatórios de conformidade (LGPD) e gestão multi-tenant de vários locais.
- **Proposta de Valor:** segurança com atrito zero. Ninguém precisa gerenciar painéis de TI — basta conectar o dispositivo à rede.
- **Plug-and-play:** conecte o Raspberry Pi (ou qualquer host com Docker) ao roteador e pronto. O MVP roda 100% local, sem depender de nuvem paga.
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

> O mesmo backend NestJS roda nos dois cenários — para um único lar ou para uma frota de locais gerenciados. Você começa grátis e sobe para a nuvem apenas quando o volume justificar.

## 3. Arquitetura (Edge + Cloud opcional)

O coração do plug-and-play é o **hostapd**: o Raspberry Pi cria a sua própria
rede Wi-Fi. Todo dispositivo que conecta nela recebe o **Pi-hole como DNS
automaticamente** — **sem ninguém precisar alterar o DNS ou o DHCP do modem da
operadora**. É isso que faz o bloqueio realmente acontecer.

```
        ┌──────────────── Raspberry Pi (o produto) ─────────────────┐
Modem ──┤ eth0 (uplink/internet)                                     │
        │                                                            │
        │  hostapd ── cria ──▶ Wi-Fi "DNS-Shield"                    │
        │     │                                                      │
        │     └─▶ dispositivos conectam e recebem via DHCP:          │
        │          • IP local (192.168.50.x)                         │
        │          • DNS = Pi-hole  ◄── as consultas passam por aqui │
        │                               e anúncios/malware são        │
        │  Pi-hole (DNS + bloqueio)        bloqueados (sinkhole)      │
        │  network_discovery (nmap/arp)  ── mapeia a rede            │
        │  ddns-client ── reporta IP público ──▶ seu backend         │
        └─────────────────────────┬───────────────────────────────── ┘
                                  │ topologia + acesso remoto
                                  ▼
┌─────────── BACKEND (local no Pi OU na nuvem — mesmo código) ──────┐
│  API NestJS  ──▶  SQLite (local)  ──ou──▶  Postgres (nuvem)       │
│       ├──▶ Analyzer (heurística local)  ──ou──▶  LLM (opcional)   │
│       └──▶ Outbox  ──▶  WhatsApp (onboarding do cliente)          │
│  Servidor DDNS (pboehm/ddns)  ──recebe o IP do Pi──▶ domínio din. │
└────────────────────────────────────────────────────────────────── ┘
```

### Edge (Raspberry Pi) — o coração plug-and-play
- **hostapd:** transforma o Pi num **ponto de acesso Wi-Fi** ("DNS-Shield"). É a
  peça que resolve o atrito: o cliente só conecta no Wi-Fi do Pi — **não mexe no
  modem**. Quem conecta usa o Pi-hole como DNS automaticamente.
- **Pi-hole:** servidor **DNS + DHCP** da rede Wi-Fi do Pi. Faz o bloqueio
  (sinkhole) de anúncios, rastreadores, phishing e malware na origem.
- **network_discovery.py:** varre a rede, descobre o gateway e classifica
  dispositivos (PC, câmera, TV, impressora).
- **ddns-client:** cliente leve (`curl` periódico) que reporta o IP público do Pi
  ao **servidor DDNS** (`pboehm/ddns`) na sua nuvem — garante acesso remoto mesmo
  com IP dinâmico. O servidor `pboehm/ddns` roda do lado da nuvem, não no Pi.

### Backend (NestJS) — roda no Pi ou na nuvem
- **API multi-tenant:** isola os dados de cada cliente (escopo por `X-Tenant-Id`).
- **Analyzer:** separa estações de trabalho de dispositivos IoT (câmeras, Smart
  TVs) e sugere um IP estático livre. Heurístico por padrão; plugável a um LLM.
- **Onboarding (outbox → WhatsApp):** confirma ao cliente que o gateway está
  online e orienta a conectar os aparelhos no Wi-Fi "DNS-Shield".

> **Por que não bastava só o Pi-hole?** O Pi-hole apenas *bloqueia* — ele fica
> parado esperando receber consultas DNS. Sem alguém apontar os dispositivos
> para ele (mexendo no modem ou em cada aparelho), ele não bloqueia nada. O
> **hostapd** é o que entrega as consultas ao Pi-hole sem tocar no modem. Pi-hole
> = bloqueador; hostapd = o que força o tráfego a passar pelo bloqueador.

## 4. Fluxo de Onboarding (Experiência do Cliente)

1. **Física:** o cliente liga o Pi na tomada e conecta o cabo ao modem (uplink).
2. **Wi-Fi:** o Pi cria a rede **"DNS-Shield"**. O cliente conecta o celular/PC/TV
   nessa rede — e só. **Nenhuma senha de modem, nenhum DNS para alterar.**
3. **Descoberta:** o Pi executa `network_discovery.py` e envia a topologia ao backend.
4. **Comunicação:** o sistema confirma via WhatsApp: *"Gateway online. Conecte
   seus aparelhos na rede Wi-Fi DNS-Shield e sua proteção já está ativa."*

## 5. Estrutura do Repositório

```
dns-shield/
├── edge-node/                  # Infra local (roda no Raspberry Pi ou qualquer host Docker)
│   ├── docker-compose.yml      # Pi-hole (DNS+DHCP) + cliente DDNS
│   ├── hostapd/                # Access Point Wi-Fi (o que torna plug-and-play)
│   │   ├── hostapd.conf        # Config da rede Wi-Fi "DNS-Shield"
│   │   └── setup-access-point.sh  # Setup no Pi (hostapd + NAT eth0<->wlan0)
│   ├── Dockerfile.discovery    # Agente de descoberta de rede (container)
│   ├── .env.example            # Variáveis de ambiente, tokens de DDNS
│   └── scripts/
│       └── network_discovery.py
├── cloud-backend/              # API NestJS multi-tenant (SQLite local → Postgres na nuvem)
│   ├── src/
│   │   ├── common/             # DbService (SQLite) + decorator multi-tenant
│   │   ├── topology/           # ingestão da topologia + Analyzer
│   │   ├── onboarding/         # outbox → WhatsApp
│   │   └── reports/            # relatórios de ameaças
│   ├── Dockerfile
│   └── .env.example
├── frontend/                   # Painel do cliente (HTML/CSS/JS estático + nginx)
│   ├── index.html
│   ├── app.js  styles.css  config.js
│   └── Dockerfile
├── docker-compose.simulation.yml  # DEMO completa sem hardware
├── demo.sh                     # Lançador de demo (macOS/Linux)
├── demo.ps1                    # Lançador de demo (Windows/PowerShell)
└── docs/
    └── arquitetura.md
```

## 6. Requisitos de Hardware (onde roda?)

O DNS Shield roda em **qualquer computador com Linux + Docker**. Ele **não** roda
em microcontroladores (Arduino, ESP32) — precisa de um sistema operacional, de
Docker e de memória para o Pi-hole e suas blocklists.

| Hardware | Roda? | Observação |
|---|---|---|
| **Arduino / ESP32** | ❌ | Microcontrolador, sem SO/Docker, RAM em KB. Inviável. |
| **Raspberry Pi 2/3/4/5** | ✅ | Alvo oficial (ARMv7/ARM64). A imagem `pihole/pihole` é multi-arch. |
| Raspberry Pi Zero 2 W | ✅ | Funciona, com folga menor de RAM. |
| Outros SBC (Orange Pi, Rock Pi) | ✅ | Qualquer Linux ARM com Docker. |
| Mini PC x86 / PC reaproveitado | ✅ | Ótimo para redes maiores. |
| **Seu Mac/Linux/Windows (demo)** | ✅ | Via Docker, para desenvolver e demonstrar. |

> **Por quê não Arduino?** Pi-hole é um servidor DNS/DHCP completo com milhões de
> domínios em blocklist e um painel web — isso exige um SO Linux e centenas de MB
> de RAM. Um Arduino tem kilobytes e não roda SO. O barato aqui é o **Raspberry
> Pi**, não o microcontrolador.

## 7. Demo sem hardware (Docker) — macOS, Linux e Windows

Não precisa de Raspberry Pi para demonstrar. A simulação sobe **tudo** em
containers na sua máquina: backend, Pi-hole, descoberta de rede (topologia
fictícia de uma rede real) e o painel do cliente.

**macOS / Linux:**
```bash
./demo.sh up        # sobe tudo e imprime o fluxo
./demo.sh down      # derruba
```

**Windows (PowerShell):**
```powershell
.\demo.ps1 up
.\demo.ps1 down
```

Pré-requisito: Docker Desktop **ou** OrbStack rodando. Ao final:

| Serviço | URL |
|---|---|
| **Painel do cliente** | http://localhost:8088 |
| Painel do Pi-hole | http://localhost:8080/admin (senha definida em `PIHOLE_PASSWORD`) |
| API | http://localhost:3000/api |

> **Nota honesta sobre o DHCP:** no Raspberry Pi real o Pi-hole roda em
> `network_mode: host` e assume o DHCP da rede física. No Docker Desktop
> (Mac/Windows) isso não é possível (a VM do Docker é isolada da sua LAN), então
> a demo roda o Pi-hole em modo bridge e usa uma topologia simulada. Tudo o mais
> — DNS, descoberta, classificação, painel, onboarding — funciona de verdade.

## 8. Frontend — Painel do Cliente

Um painel web leve (HTML/CSS/JS puro, sem build) pensado para o cliente final
(consumidor ou gestor), não para o time de TI. Mostra:

- **Status do gateway** (online/offline) e IP sugerido;
- **Dispositivos descobertos** com classificação (PC, câmera IoT, TV, impressora);
- **Quantos dispositivos IoT** foram isolados;
- **Relatório de ameaças** (consultas, bloqueadas, taxa de bloqueio);
- Atualização automática a cada 15s.

> **Marca própria, não a do Pi-hole.** O cliente vê apenas o painel DNS Shield
> (logo e identidade em `frontend/logo.svg`). O admin nativo do Pi-hole (porta
> 8090/8080) é uma **ferramenta interna de operação/suporte** e **não deve ser
> exposto ao cliente** — isso evita confusão de marca e respeita a licença/marca
> do Pi-hole. Toda a experiência de marca do produto vive no `frontend/`, onde
> temos controle total.

Rodando localmente (fora do Docker):
```bash
cd frontend
python3 -m http.server 8088   # abre em http://localhost:8088
```

> **Testar o bloqueio no seu próprio PC** (sem Raspberry Pi): veja o guia
> [`docs/teste-local.md`](docs/teste-local.md) e a pasta [`local-test/`](local-test/) —
> inclui como rodar e **como reverter** o DNS com segurança.

## 8.1 IA Local com Llama — privacidade por design

A análise da rede e a geração das mensagens de onboarding podem ser feitas por um
**LLM local (Llama via [Ollama](https://ollama.com))** rodando **no próprio
ambiente do cliente**. Isso é um diferencial de **privacidade**:

- Os dados da rede (IPs, MACs, dispositivos) **nunca saem** do dispositivo — não
  há chamada a nuvens de IA de terceiros (OpenAI, etc.).
- Funciona **offline**. Se o Llama estiver indisponível, o sistema **cai na
  heurística local** automaticamente — nunca quebra e nunca vaza dados.
- Open source de ponta a ponta (Llama + Ollama + Pi-hole).

Ativar na demo (baixa o modelo Llama, ~2 GB, no primeiro uso):
```bash
LLM_ENABLED=true docker compose -f docker-compose.simulation.yml --profile ai up -d
```

Config por ambiente (`cloud-backend/.env`):
```
LLM_ENABLED=true
LLM_API_URL=http://ollama:11434
LLM_MODEL=llama3.2        # use llama3.2:1b em hardware mais fraco (ex.: Raspberry Pi)
```

> Sem `--profile ai`, a demo roda normal e grátis, 100% heurística. O Llama é um
> **upgrade opcional** que melhora a experiência sem comprometer a privacidade.

> 🔒 **Como conciliamos IA central com privacidade total:** veja
> [`docs/arquitetura-privacidade.md`](docs/arquitetura-privacidade.md) — o modelo
> "inteligência desce, dados do cliente nunca sobem", a base de conhecimento
> ([`knowledge-base/`](knowledge-base/)) e os perfis (incl. controle parental).

## 9. Quick Start (produção / Raspberry Pi)

### 9.1 Edge (no Raspberry Pi)

**Passo 1 — transformar o Pi em Access Point Wi-Fi (uma vez):**
```bash
cd edge-node
sudo ./hostapd/setup-access-point.sh     # instala hostapd + NAT, cria o Wi-Fi "DNS-Shield"
```

**Passo 2 — subir Pi-hole + cliente DDNS:**
```bash
cp .env.example .env            # preencha WEBPASSWORD e DDNS_URL
docker compose up -d
```

> **`network_mode: host`** permite o Pi-hole enxergar a interface `wlan0` do hostapd e servir DHCP/DNS.
> **`NET_ADMIN`** é a capability de kernel obrigatória para distribuir IPs.

**Passo 3 — testar o bloqueio (conecte um celular no Wi-Fi "DNS-Shield"):**
```bash
# No próprio Pi, confirme que anúncios são bloqueados (retorna 0.0.0.0):
dig doubleclick.net @127.0.0.1
# e que sites normais resolvem normalmente:
dig github.com @127.0.0.1
```

Varredura da rede e envio ao backend:

```bash
sudo TENANT_ID=clinica-centro CLOUD_API_URL=http://localhost:3000/api \
  python3 edge-node/scripts/network_discovery.py --send
```

### 9.2 Backend (local, grátis)

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

## 10. API (resumo)

Todas as rotas exigem o header `X-Tenant-Id` (isolamento multi-tenant), exceto `/health`.

| Método | Rota | Descrição |
|---|---|---|
| `GET`  | `/api/health` | Health check |
| `POST` | `/api/topology` | Ingere a topologia descoberta no Edge; retorna o plano de segurança |
| `GET`  | `/api/topology` | Histórico de varreduras do local |
| `GET`  | `/api/reports/latest` | Último relatório de ameaças bloqueadas |
| `POST` | `/api/reports` | Salva um relatório puxado do Pi-hole |

## 11. Escalando para a nuvem (quando precisar)

Nada disso é necessário para o MVP. Quando o número de locais gerenciados crescer:

1. **Banco:** troque `DbService` (SQLite) por um adaptador Postgres — o contrato `put`/`queryByPrefix` é o mesmo.
2. **Onboarding:** adicione um worker que drena a tabela `OUTBOX#` para uma fila (Redis/SQS) e entrega via WhatsApp.
3. **IA:** aponte `LLM_API_URL` para um Ollama self-host (open source) e refine a classificação no `AnalyzerService`.
4. **Deploy:** empacote o mesmo backend em container e suba em Kubernetes/serverless.

### Acesso remoto (escalabilidade futura)

Gerenciar o painel de fora de casa, sem abrir portas no modem do cliente:

- **Túnel reverso** (ex.: Tailscale ou WireGuard): o aparelho abre uma conexão
  de *saída* para a nuvem (que o modem sempre permite), criando um canal seguro
  de gestão remota. **Zero configuração de modem** — mantém o plug-and-play.
- **DDNS** (`ddns-client` já presente): dá um nome fixo (`casa-cliente.suaempresa.com`)
  mesmo com IP dinâmico.
- **Importante (distinção):** acessar o painel de fora é **gestão remota** — não
  protege o seu celular na rua. Para o dispositivo ficar filtrado fora de casa é
  preciso **proteção em roaming** via DNS-over-HTTPS/TLS (DoH/DoT) ou VPN de volta
  à rede — uma evolução separada.

## 12. O que o DNS Shield é (e não é)

Comparação para posicionamento — útil no pitch e para responder objeções:

| Tecnologia | O que faz | Relação com o DNS Shield |
|---|---|---|
| **DNS Shield** | Filtra **para onde os dispositivos vão** (bloqueia domínios de anúncio/malware/phishing na camada de DNS) | — |
| **WAF** (Web Application Firewall) | Protege **um site que você hospeda** de ataques HTTP (SQLi, XSS) que *entram* | Diferente e **complementar** — WAF olha quem chega ao seu servidor; nós olhamos para onde os aparelhos vão |
| **VPN** | **Criptografa/esconde** o caminho do tráfego | Complementar — VPN esconde a origem; nós bloqueamos o destino perigoso |
| **Firewall de pacotes** | Bloqueia por IP/porta | Camada mais baixa; nós agimos por **domínio** |
| **NextDNS / Cisco Umbrella / Cloudflare Gateway** | DNS security / Secure Web Gateway | **Mesma categoria** — somos a versão open source, plug-and-play e gerenciável |
| **Pi-hole** | Motor de bloqueio por DNS | Nós **usamos** o Pi-hole por baixo e entregamos como produto gerenciado |

> **Categoria técnica:** DNS Filtering / Secure Web Gateway (SWG) na camada de DNS.
> **Não é** WAF, nem firewall de pacotes, nem antivírus — é a primeira linha de
> defesa, a mais custo-efetiva, e a única plug-and-play.

## 13. Contribuindo

> 📣 **Material de pitch:** veja [`docs/pitch.md`](docs/pitch.md) — roteiro de
> apresentação de 3 minutos (dor, problema, solução, custo, concorrência,
> escalabilidade) — e [`docs/pitch-slides.md`](docs/pitch-slides.md) para a
> versão em slides.

Projeto open source sob licença MIT — contribuições são bem-vindas (Hacktoberfest-friendly 🎃).

1. Faça um fork e crie uma branch (`git checkout -b feature/minha-ideia`).
2. Rode o build/testes do backend (`cd cloud-backend && npm run build`).
3. Abra um Pull Request descrevendo a mudança.

## 14. Licença

[MIT](LICENSE) — use, modifique e distribua livremente.
