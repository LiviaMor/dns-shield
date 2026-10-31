---
marp: true
title: DNS Shield — Pitch
paginate: true
---

<!--
Slides do pitch de 3 minutos do DNS Shield.
Um slide por seção; bullets curtos (para o telão) + notas do apresentador (o que
falar). Pronto para colar no Canva/PowerPoint ou renderizar com Marp
(https://marp.app): `marp pitch-slides.md --pdf`.
Regra de ouro: NÃO leia o slide. O slide é apoio; a fala está nas notas.
-->

# 🛡️ DNS Shield

### Segurança de internet plug-and-play para quem não tem TI

Bloqueia golpes, malware e rastreadores **antes** de chegarem aos seus aparelhos.

<!--
Abertura (10s): "Uma clínica fica 4 dias sem atender porque alguém clicou num
boleto falso e o ransomware travou a agenda. A gente impede esse clique de virar
prejuízo — sem a clínica entender nada de tecnologia."
-->

---

## A dor

- Pequenos negócios e famílias **sem equipe de TI**
- Um clique em phishing **paralisa a operação** (agenda, caixa, prontuário)
- Vazamento de dados = **multa de LGPD** + perda de confiança
- Anúncios, rastreadores e golpes entram livres na rede

> Segurança de nível corporativo para quem **não tem (nem quer) TI**.

<!--
(25s) Enfatize a dor emocional e financeira, não a técnica. "Agenda parada" e
"multa de LGPD" são as duas palavras que prendem o júri.
-->

---

## O problema real

A tecnologia para bloquear **já existe e é grátis** (Pi-hole).
Então por que ninguém usa?

- Exige mexer no **DNS/modem** → o cliente leigo **não consegue**
- Exige manutenção e leitura de logs → **ninguém faz**
- Fica instalada e **não protege nada**

> O problema não é falta de tecnologia.
> É falta de um **produto que qualquer um consiga usar**.

<!--
(30s) Este é o slide-chave. O insight: a commodity (bloqueio) existe; o que falta
é a experiência. É aí que está o negócio.
-->

---

## A solução

1. **Liga** o aparelho (tomada + modem)
2. Ele **cria a própria rede Wi-Fi** — ninguém mexe no modem
3. Quem conecta fica **protegido automaticamente**
4. Gestor recebe **WhatsApp** + **painel** com ameaças bloqueadas

> Diferencial: **plug-and-play + gestão remota + onboarding + relatórios.**
> O bloqueador é commodity; a **experiência** é o produto.

<!--
(35s) Se possível, MOSTRE a demo aqui: painel em http://localhost:8088 bloqueando
doubleclick.net / ads.google.com em tempo real. Prova vale mais que slide.
-->

---

## Custo operacional

| Item | Custo |
|---|---|
| Software | **R$ 0** (open source) |
| Nuvem no MVP | **R$ 0** (roda local) |
| Visita técnica | **R$ 0** (suporte remoto) |
| Hardware | baixo, **comodato reutilizável** |

> Custo marginal de **mais um cliente ≈ zero**. Margem alta desde o 1º.

<!--
(25s) Mensagem: sem licença, sem visita, sem nuvem cara no início. Escala sem
estourar custo.
-->

---

## Concorrência

| Alternativa | Lacuna que exploramos |
|---|---|
| Pi-hole cru | não é plug-and-play |
| NextDNS / Umbrella | caros, para empresas com TI |
| Firewalla | importado, caro, sem foco BR/LGPD |
| VPN | esconde o caminho, **não bloqueia o golpe** |
| Antivírus | age **depois**; nós agimos **antes** |

> **Não** somos VPN, WAF nem antivírus. Somos **Secure Web Gateway de DNS**.

<!--
(30s) Se perguntarem "é VPN/WAF?": VPN esconde o caminho, nós bloqueamos o
destino; WAF protege site hospedado, nós protegemos os dispositivos.
-->

---

## Escalabilidade

- **Mesmo código** para 1 casa ou 10.000 clínicas
- **Local-first → nuvem opcional** (SQLite→Postgres), sem reescrita
- **Multi-tenant** desde o dia 1
- **Gestão 100% remota**: 1 pessoa opera milhares de aparelhos
- **Receita recorrente (MRR)**: assinatura + comodato

<!--
(25s) Roadmap rápido: acesso remoto por túnel reverso, proteção em roaming
(DoH/DoT), perfis de IA por tipo de cliente. Não entrar em detalhe técnico.
-->

---

## Resumo

> **Você liga, conecta no Wi-Fi, e está protegido.**
> Bloqueamos golpes e vazamentos antes que cheguem aos seus aparelhos —
> sem você mexer em nada.

- **Consumidor:** privacidade e controle da família, sem configurar
- **Empresa:** a agenda não para + conformidade LGPD

Open source · custo quase zero · pronto para escalar

<!--
(15s) Feche com a frase de valor: "Vendemos a tranquilidade de não precisar
entender de segurança."
-->

---

# Obrigada! 🛡️

### Equipe

| Nome | Papel | Contato |
|---|---|---|
| _(nome)_ | Produto / Negócio | _(contato)_ |
| _(nome)_ | Engenharia | _(contato)_ |
| _(nome)_ | Infra / Edge | _(contato)_ |

**Repo:** github.com/LiviaMor/dns-shield  ·  **Demo:** `./demo.sh up`

### Perguntas?

<!--
Deixe este slide no telão durante o Q&A. Tenha os números na ponta da língua:
~76 mil domínios bloqueados, ~23% das consultas na demo, R$0 de custo de software.
-->
