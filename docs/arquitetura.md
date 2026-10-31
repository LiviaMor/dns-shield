# Arquitetura — DNS Shield

Documento de referência do fluxo de DNS, descoberta de rede e onboarding.

## Princípio

**Local primeiro, nuvem opcional.** O MVP roda inteiro no Raspberry Pi, sem
serviço pago. A nuvem é um caminho de escala, não um requisito.

## Componentes

### Edge (Raspberry Pi 2 — ARMv7)

| Componente | Papel |
|---|---|
| **Pi-hole** | Servidor DNS + DHCP. Filtra domínios maliciosos e distribui IPs da LAN. |
| **pboehm/ddns** | Mantém um domínio apontando para o IP público dinâmico da clínica. |
| **network_discovery.py** | Varre a rede (nmap → arp-scan → tabela ARP), descobre o gateway e classifica dispositivos. |

### Backend (NestJS — local ou nuvem)

| Módulo | Responsabilidade |
|---|---|
| `common/DbService` | Persistência single-table escopada por tenant (SQLite no MVP). |
| `common/TenantId` | Decorator que extrai e valida `X-Tenant-Id` (isolamento multi-tenant). |
| `topology` | Ingestão da topologia + `AnalyzerService` (perfis de segurança). |
| `onboarding` | Outbox de instruções → entrega via WhatsApp. |
| `reports` | Relatórios de ameaças bloqueadas por clínica. |

## Fluxo de dados (onboarding)

```
Pi-hole/DHCP sobe
      │
      ▼
network_discovery.py  ── varre a LAN ──▶  topologia JSON
      │
      ▼  POST /api/topology  (X-Tenant-Id: clinica-centro)
Backend NestJS
      ├─▶ DbService.put(TENANT#.../TOPOLOGY#...)        [persistência]
      ├─▶ AnalyzerService.analyze()                     [separa PC x IoT, escolhe IP livre]
      └─▶ OnboardingService.enqueueInstructions()       [outbox → WhatsApp]
                                   │
                                   ▼
                     Gestor recebe o passo a passo
                     para desativar o DHCP do roteador
```

## Modelo de dados (single-table)

```
pk = TENANT#<tenantId>
sk = TOPOLOGY#<iso-timestamp>   -> varreduras de rede
   | REPORT#<iso-timestamp>     -> relatórios de ameaças
   | OUTBOX#<iso-timestamp>     -> mensagens pendentes de onboarding
data = JSON
```

Esse formato mapeia 1:1 para SQLite (MVP), Postgres (JSONB) ou DynamoDB, então
a migração para a nuvem não exige mudança nos serviços de domínio.

## Decisões de design

- **SQLite no MVP:** zero dependências externas, cabe na RAM do Pi 2, backup é
  copiar um arquivo.
- **Heurística antes de IA:** a classificação de dispositivos funciona offline;
  um LLM é um refinamento opcional, não um ponto único de falha.
- **Outbox em vez de fila:** garante que nenhuma instrução se perca mesmo sem
  broker; a entrega real pode ser drenada por qualquer worker.
