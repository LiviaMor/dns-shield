# DNS Shield — Pitch (3 minutos)

> Roteiro de apresentação. Tempo-alvo: **3 minutos**. Os tempos entre colchetes
> são um guia para ensaiar. Fale com números e com a dor — não com tecnologia.
>
> 🖼️ **Versão em slides:** [`pitch-slides.md`](pitch-slides.md) (um slide por
> seção, pronto para Canva/PowerPoint ou Marp).

---

## 0. Abertura (10s)

> "Uma clínica fica **4 dias sem atender** porque alguém clicou num boleto falso
> e o ransomware travou a agenda. A gente impede esse clique de virar prejuízo —
> sem a clínica ter que entender nada de tecnologia."

---

## 1. A DOR / O PROPÓSITO (25s)

Pequenos negócios e famílias estão **expostos** na internet e **não têm TI**.

- Um clique num link de phishing paralisa a operação (agenda, caixa, prontuário).
- Vazamento de dados de paciente = **multa de LGPD** + perda de confiança.
- Anúncios, rastreadores e golpes entram livremente na rede de casa e do trabalho.

**Propósito:** dar segurança de nível corporativo para quem **não tem (nem quer)
um departamento de TI** — com atrito zero.

---

## 2. O PROBLEMA REAL (30s)

A tecnologia para bloquear isso **já existe e é grátis** (ex.: Pi-hole). Então por
que ninguém usa? Porque **não é plug-and-play**:

- Exige alterar o DNS/DHCP do modem — **o cliente leigo não consegue** (modem
  travado pela operadora, senha desconhecida).
- Exige manutenção, atualização de listas, leitura de logs — **ninguém faz**.
- Resultado: a proteção fica instalada mas **não protege nada**, porque o tráfego
  nunca passa por ela.

> **O problema não é "falta tecnologia". É "falta de um produto que qualquer
> pessoa consiga usar".** É esse o buraco que a gente preenche.

---

## 3. A SOLUÇÃO (35s)

Um **gateway de segurança DNS plug-and-play**, entregue como serviço gerenciado.

1. O cliente **liga o aparelho** na tomada e no modem.
2. O aparelho **cria a própria rede Wi-Fi** ("DNS-Shield") — ninguém mexe no modem.
3. Quem conecta nessa rede fica **protegido automaticamente**: anúncios, malware,
   phishing e rastreadores bloqueados na origem.
4. O gestor recebe um **WhatsApp** de boas-vindas e um **painel** com as ameaças
   bloqueadas no mês — a prova de valor.

**Diferencial técnico (o que ninguém faz):** a camada de **plug-and-play
(hostapd) + gestão remota + onboarding automatizado + relatórios**. O bloqueador
é commodity; a **experiência sem atrito** é o produto.

> Demonstrável hoje: bloqueamos `doubleclick.net`, `ads.google.com` e
> `googlesyndication.com` em tempo real — com relatório no painel.

---

## 4. CUSTO OPERACIONAL (25s)

Enxuto por design — **margem alta desde o primeiro cliente**:

| Item | Custo |
|---|---|
| Hardware (Raspberry Pi, comodato) | baixo, **reutilizável** |
| Software | **R$ 0** — 100% open source (Pi-hole, Linux, Docker) |
| Nuvem no MVP | **R$ 0** — roda local (SQLite, heurística, sem AWS) |
| Nuvem ao escalar | **sob demanda** — só quando o nº de clientes justificar |
| Visita técnica | **R$ 0** — onboarding e suporte 100% remotos (via DDNS) |

> Sem licença de software, sem visita técnica, sem nuvem cara no início.
> **O custo marginal de mais um cliente é quase zero.**

---

## 5. CONCORRÊNCIA (30s)

**Não somos VPN, não somos WAF, não somos antivírus** — somos a camada de DNS.

| Concorrente | Lacuna que exploramos |
|---|---|
| **Fazer sozinho (Pi-hole cru)** | Não é plug-and-play; a pessoa instala e não consegue usar |
| **NextDNS / Cisco Umbrella** | Caros, voltados a empresas grandes/TI, sem hardware gerenciado local |
| **Firewalla (appliance)** | Importado, caro, sem foco em LGPD/mercado BR, sem serviço gerenciado |
| **VPN** | Esconde o caminho, **não bloqueia o destino** — não impede o clique no golpe |
| **Antivírus** | Age depois da infecção; nós agimos **antes**, na rede |

> **Nosso espaço:** segurança de DNS **gerenciada, plug-and-play e localizada no
> Brasil (LGPD)**, para quem não tem TI. Open source reduz o custo e gera confiança.

---

## 6. ESCALABILIDADE (25s)

**O mesmo código roda para 1 casa ou 10.000 clínicas** — a arquitetura não muda,
só a configuração.

- **Local-first → nuvem opcional:** SQLite vira Postgres, outbox vira fila, tudo
  atrás de contratos simples. Zero reescrita.
- **Multi-tenant** desde o dia 1: cada cliente isolado por `tenant`.
- **Gestão 100% remota:** 1 pessoa opera milhares de aparelhos do escritório.
- **Receita recorrente (MRR):** assinatura + comodato — previsível e escalável.
- **Roadmap:** acesso remoto por túnel reverso, proteção em roaming (DoH/DoT),
  perfis de IA por tipo de cliente.

---

## 7. RESUMO DA SOLUÇÃO (15s)

> "**DNS Shield**: você liga, conecta no Wi-Fi, e está protegido. Bloqueamos
> golpes e vazamentos antes que cheguem aos seus aparelhos — sem você mexer em
> nada. Open source, custo quase zero, pronto para escalar. Vendemos **a
> tranquilidade de não precisar entender de segurança.**"

**Para o consumidor:** privacidade e controle da família, sem configurar nada.
**Para a empresa:** a agenda não para, e você fica em dia com a LGPD.

---

## 8. A EQUIPE / CONTATO

> _Espaço para apresentar as pessoas._

| Nome | Papel | Contato |
|---|---|---|
| _(nome)_ | _(ex.: Produto / Negócio)_ | _(e-mail / LinkedIn)_ |
| _(nome)_ | _(ex.: Engenharia / Backend)_ | _(e-mail / LinkedIn)_ |
| _(nome)_ | _(ex.: Infra / Edge)_ | _(e-mail / LinkedIn)_ |

**Projeto (open source):** https://github.com/LiviaMor/dns-shield
**Demo ao vivo:** `./demo.sh up` → painel em http://localhost:8088

> _"Obrigada. Perguntas?"_

---

### Anexo — números para ter na ponta da língua

- Blocklist ativa: **~76 mil domínios** bloqueados por padrão.
- Prova real na demo: **~23% das consultas bloqueadas** (anúncios/rastreio).
- Tempo de instalação pelo cliente: **conectar 2 cabos + escolher o Wi-Fi.**
- Custo de software e nuvem no MVP: **R$ 0.**
