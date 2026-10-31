# Arquitetura de Privacidade — Inteligência central, dados locais

Como o DNS Shield concilia **IA/inteligência centralizada** com **privacidade
total do cliente**. Este é o conceito que diferencia o produto e que sustenta a
venda da assinatura.

## O princípio

> **A inteligência desce. Os dados do cliente nunca sobem.**

Nós mantemos uma **base de conhecimento central** (ameaças, LGPD, perfis) e a
distribuímos para os aparelhos. Os dados da rede do cliente (IPs, MACs, consultas)
**ficam no dispositivo dele** e nunca chegam até nós. Não é possível violar a
privacidade com um dado que nunca recebemos.

```
VOCÊ (central)                          CLIENTE (edge — privado)
┌───────────────────────────┐          ┌───────────────────────────────┐
│ Base de conhecimento        │          │ Pi-hole aplica as regras       │
│  • threats/ (o que é ataque)│  push    │ Dados da rede FICAM AQUI        │
│  • compliance/ (LGPD)       │ ───────▶ │ (nmap, consultas, dispositivos)│
│  • profiles/ (perfis)       │ regras/  │                                │
│ Llama central + RAG         │ perfis/  │ nada é enviado de volta         │
│  cura e gera a inteligência │ blocklist│                                │
└───────────────────────────┘          └───────────────────────────────┘
         ▲ nunca recebe dado do cliente
```

## As 3 camadas (o que é real)

| Camada | Onde | Vê dado do cliente? | Função |
|---|---|---|---|
| Base de conhecimento + Llama + RAG | **central (nós)** | ❌ nunca | curar/gerar a inteligência |
| Distribuição (API `/knowledge`) | central → edge | ❌ | entregar versão/perfis/blocklists |
| Aplicação (Pi-hole) | **edge (cliente)** | — (é local) | bloquear; dados ficam locais |

## Por que o Llama é central (e não aprende "sozinho")

Um LLM **não aprende em tempo real** — seu conhecimento é fixo no treino. O que
mantém o sistema atualizado é:

1. **Threat intelligence ao vivo:** blocklists atualizadas continuamente pela
   comunidade global entram na nossa base.
2. **RAG (Retrieval-Augmented Generation):** o Llama central **consulta** a base
   de conhecimento (sempre atualizada por nós) em vez de ser re-treinado. Assim
   ele raciocina com informação nova sem custo de re-treino.
3. **Futuro — Federated Learning:** para a IA melhorar com o parque **sem ver
   dados brutos**, treina-se localmente e envia-se só parâmetros mascarados;
   o servidor agrega com privacidade (secure aggregation + differential privacy).

## O que vendemos

- **Assinatura da inteligência gerenciada e sempre atualizada** (não o acesso à
  rede do cliente).
- **Perfis** por público: `padrao`, `familia-controle-parental` (bloqueia também
  conteúdo adulto, apostas, violência) e `clinica-lgpd` (foco em continuidade +
  conformidade).
- **Selo de privacidade (LGPD-by-design):** "nós nunca temos acesso à sua rede".

## Onde está no código

- Base: [`knowledge-base/`](../knowledge-base/) — `threats/`, `compliance/`,
  `profiles/`, `version.json`.
- Distribuição: `cloud-backend` → `GET /api/knowledge/version`,
  `/api/knowledge/profiles`, `/api/knowledge/profiles/:id`.
- RAG: `AnalyzerService` injeta o conteúdo de `threats/`+`compliance/` no prompt
  do Llama local.

## Referências (pesquisa)

Padrões confirmados na indústria e na literatura (conteúdo reformulado para
conformidade de licença):

- Protective DNS / threat intel central distribuída, modo *no-logs* —
  [NextDNS](https://nextdns.io/),
  [Cloudflare Protective DNS](https://developers.cloudflare.com/reference-architecture/diagrams/sase/gateway-for-protective-dns/),
  [ControlD](https://controld.com/resources/enterprise-dns-security).
- "Não podemos violar a privacidade com dados que nunca recebemos" (posicionamento
  do setor) — [Paloryx Labs](https://paloryxlabs.com/).
- Federated Learning com agregação segura / differential privacy para detecção de
  domínios maliciosos —
  [sciopen](https://www.sciopen.com/local/article_pdf/10.32604/cmc.2026.077337.pdf),
  [DN.org](https://dn.org/applying-federated-learning-to-dns-threat-detection/).
- Federated fine-tuning de LLMs em edge preservando privacidade —
  [arXiv 2509.09097](https://arxiv.org/html/2509.09097),
  [Edge-FIT (arXiv 2510.03284)](https://arxiv.org/pdf/2510.03284).
