---
marp: true
title: DNS Shield Home AI — Pitch
paginate: true
---

<!--
Pitch Shark Tank — 3 minutos, 7 slides.
DNS Shield Home AI — O Guardião Inteligente da Casa Conectada.
Bullets no telão; a fala (narrativa) vai nas notas do apresentador.
Render: marp docs/pitch-home-ai.md --pdf
-->

# 🛡️ DNS Shield Home AI
## O Guardião Inteligente da Casa Conectada

**Conecte. Proteja. Controle.**

<!--
ABERTURA / A HISTÓRIA (30s) — contar, não ler:
"São 22h. Seus filhos dormem. A câmera do quarto, a Alexa, a Smart TV, o
videogame, o aspirador robô — tudo ligado. Tudo parece seguro. Mas quem está
protegendo a sua casa DIGITAL? Todo mundo tem fechadura, alarme e câmera para o
lado de fora. Quase ninguém sabe o que acontece DENTRO da própria rede."
-->

---

# 1 · O problema

A casa ficou inteligente — e **vulnerável**.

- **45%** das residências inteligentes no Brasil têm ≥1 dispositivo vulnerável
- **66%** dos roteadores domésticos estão em risco
- Os alvos: **câmeras, TVs, assistentes, impressoras, IoT** — ligados 24h/dia

> O perigo não está só no computador. Está em tudo que fica "sempre ligado".

<!--
(25s) Fonte: Avast (pesquisa Brasil, 2 mi+ de redes). Tenha a fonte na ponta da
língua — o Shark vai perguntar. Enfatize: são aparelhos que ninguém atualiza nem
vigia, ligados o dia inteiro.
-->

---

# 2 · O insight

Na casa **física**, você percebe quando algo está errado.
Na casa **digital**, você não percebe.

As ferramentas atuais mostram: `logs`, `IPs`, `portas`, `DNS`, `alertas`.
E ninguém entende isso.

> O problema não é falta de informação.
> É **falta de interpretação**.

<!--
(25s) Este é o pivô do pitch. A commodity (bloquear) já existe e é grátis. O que
falta é TRADUZIR o técnico para humano. É aí que está o nosso produto.
-->

---

# 3 · A solução — AI First

## DNS Shield Home AI
Appliance com **IA local** que observa a rede e **traduz** para linguagem humana.

| Concorrente mostra | Nós dizemos |
|---|---|
| `192.168.0.105` | "Um novo dispositivo entrou na sua rede há 15 min." |
| `Blocked Request` | "Bloqueamos uma conexão com um site suspeito." |
| `Firmware Outdated` | "Um aparelho está desatualizado e mais vulnerável." |

Instalar: **liga na tomada → conecta no Wi-Fi "DNS-Shield" → pronto.**
Sem mexer no roteador. Sem técnico.

<!--
(40s) MOSTRE A DEMO aqui: painel bloqueando doubleclick.net/ads.google.com em
tempo real (http://localhost:8088). "Liga, conecta no Wi-Fi, protegido" — é o
hostapd que cria a rede própria, sem tocar no modem.
-->

---

# 4 · Privacidade de verdade (o diferencial)

Não lemos mensagens. Não lemos e-mails. Não escutamos conversas.
Analisamos **apenas o comportamento da rede**.

- **IA local (Llama)** — roda dentro de casa
- **Dados ficam na residência** — sem cloud obrigatória
- **Inteligência desce; dados do cliente nunca sobem**
- Sem venda de dados. Sem monitoramento invasivo.

> "Não podemos violar a privacidade com um dado que nunca recebemos."

<!--
(30s) Este é o trunfo e o que nos separa das big techs. A IA é central só para
CURAR a inteligência (ameaças, controle parental); a análise dos dados do cliente
é local. Modelo confirmado pela indústria (NextDNS/Cloudflare).
-->

---

# 5 · Concorrência & Negócio

| | Pi-hole | NextDNS | Firewalla | **Home AI** |
|---|:---:|:---:|:---:|:---:|
| Linguagem natural | ❌ | ❌ | ❌ | ✅ |
| IA local | ❌ | ❌ | ❌ | ✅ |
| Privacidade por padrão | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Zero config / famílias | ❌ | ❌ | ⚠️ | ✅ |

**Modelo:** hardware **R$ 699** (venda única) + add-ons recorrentes:
Remote (acesso remoto) · Care (suporte SLA) · Updates estendidas.
**Os dados continuam do cliente.**

<!--
(30s) Não vendemos firewall/bloqueador/dashboard — vendemos TRANQUILIDADE. O
hardware paga o CAC; a recorrência (serviços) é a margem. Open source por baixo
reduz custo e gera confiança.
-->

---

# 6 · Roadmap, visão e o pedido

**MVP em 6 semanas** (1 IA + 1 full stack) · **Beta**: 10 casas em 30 dias.
**Meta:** *95% instalam sem ajuda humana — se precisar de técnico, falhamos.*

Hoje protegemos a rede. Amanhã respondemos:
*"Minha casa está segura? O que mudou? Tem algum aparelho que eu não reconheço?"*

> A maioria usa IA para **aprender sobre o usuário**.
> Nós usamos IA para o **usuário entender a própria tecnologia**.

**DNS Shield Home AI — o guardião que faltava.** 🛡️

<!--
(30s) Feche com o pedido (investimento/parceria) e a visão. Resposta pronta para
"qual o diferencial?": "Não vendemos um firewall nem um dashboard. Vendemos
tranquilidade: transformamos riscos invisíveis em explicações que qualquer um
entende — sem abrir mão da privacidade."
PROVA real na demo: ~76 mil domínios bloqueados, ~23% das consultas filtradas,
IA local com fallback, open source em github.com/LiviaMor/dns-shield.
-->

---

## Fonte dos dados

Estatísticas de vulnerabilidade: **Avast** — pesquisa com 2 milhões+ de redes
domésticas no Brasil (45% das casas inteligentes com ≥1 dispositivo vulnerável;
66% dos roteadores em risco). *Conteúdo reformulado para conformidade de licença.*
- https://blog.avast.com/pt-br/45-das-resid%C3%AAncias-inteligentes-no-brasil-possuem-dispositivos-vulner%C3%A1veis
