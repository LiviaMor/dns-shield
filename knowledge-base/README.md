# Knowledge Base — DNS Shield

Esta é a **base de conhecimento central** do DNS Shield: a "inteligência" que
ensina o sistema (e o Llama) a entender o que é ataque e como proteger cada tipo
de cliente.

## Por que ela existe (o que vendemos)

- O cliente assina a **atualização contínua** desta base. Novas ameaças, novas
  regras e novos perfis são curados aqui (central) e **distribuídos** para os
  aparelhos.
- **Privacidade por design:** esta base só contém conhecimento *público/curado*
  (ameaças, legislação, perfis). **Nenhum dado de cliente** entra aqui — os dados
  da rede do cliente nunca saem do dispositivo dele.

## Estrutura

```
knowledge-base/
├── threats/           # O que é cada tipo de ataque (ensina o Llama/RAG)
│   ├── phishing.md
│   ├── malware-ransomware.md
│   └── trackers-telemetry.md
├── compliance/        # Legislação (LGPD) para relatórios e orientação
│   └── lgpd.md
├── profiles/          # Perfis de bloqueio aplicáveis por cliente
│   ├── familia-controle-parental.json
│   ├── clinica-lgpd.json
│   └── padrao.json
└── version.json       # Versão da base (usada na distribuição/atualização)
```

## Fluxo

1. **Curadoria (central):** mantemos `threats/`, `compliance/` e `profiles/`.
2. **RAG:** o Llama central consulta `threats/` e `compliance/` para explicar
   ameaças e gerar relatórios/orientações em linguagem humana.
3. **Distribuição:** os `profiles/` (listas de bloqueio) descem para o aparelho
   do cliente conforme o perfil contratado.
4. **Atualização:** ao publicar uma nova versão (`version.json`), os aparelhos
   baixam a base atualizada — é o produto recorrente.
