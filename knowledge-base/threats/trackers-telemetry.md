# Ameaça: Rastreadores e Telemetria

## O que é
Rastreadores (trackers) e telemetria coletam dados de comportamento (o que você
acessa, por quanto tempo, de onde) e enviam para empresas de publicidade e
análise — muitas vezes sem consentimento claro.

## Como age na rede
Páginas e apps fazem consultas DNS para domínios de rastreamento
(ex.: redes de anúncios, pixels de tracking, telemetria de SO/apps). Bloquear
esses domínios corta a coleta na origem e ainda **acelera a navegação** (menos
scripts e mídia publicitária para baixar).

## Sinais típicos (para o Llama classificar)
- Domínios de redes de anúncios e analytics conhecidos.
- Telemetria de sistemas operacionais e aplicativos.
- Pixels de rastreamento e fingerprinting.

## Impacto para o cliente
- **Clínica/empresa:** vazamento indireto de informação e risco de conformidade
  (dados trafegando para terceiros sem base legal).
- **Família/consumidor:** perda de privacidade, perfilamento, anúncios invasivos.

## Como o DNS Shield protege
Bloqueia os domínios de rastreio/telemetria via blocklist, melhorando privacidade
e desempenho. É a base do perfil de **privacidade** e do **controle parental**.
