# Ameaça: Phishing

## O que é
Phishing é a tentativa de enganar uma pessoa para que ela revele dados sensíveis
(senhas, dados bancários) ou execute uma ação perigosa (pagar um boleto falso,
baixar um anexo malicioso), geralmente imitando uma entidade confiável.

## Como age na rede
A vítima clica em um link (e-mail, WhatsApp, SMS) que aponta para um domínio
malicioso. O navegador faz uma consulta DNS para esse domínio — e é aí que o
DNS Shield intercepta: se o domínio está na base de ameaças, a resolução é
bloqueada e a página nunca carrega.

## Sinais típicos (para o Llama classificar)
- Domínios recém-registrados (NRD — Newly Registered Domains).
- Domínios que imitam marcas (ex.: "bancob rasil-seguro.com").
- Encurtadores de URL apontando para destinos desconhecidos.
- Domínios com certificado recém-emitido e sem reputação.

## Impacto para o cliente
- **Clínica/empresa:** um clique pode levar a roubo de credenciais e, em seguida,
  a ransomware — paralisando a operação.
- **Família/consumidor:** golpes financeiros, roubo de contas.

## Como o DNS Shield protege
Bloqueio na camada de DNS (sinkhole) antes de a página carregar, usando as
blocklists de phishing atualizadas continuamente nesta base de conhecimento.
