import { Injectable } from '@nestjs/common';
import { TopologyDto } from './dto/topology.dto';

export interface SecurityPlan {
  /** IP estático sugerido para o gateway DNS Shield. */
  suggestedGatewayIp: string | null;
  /** Dispositivos agrupados por perfil de segurança. */
  profiles: Record<string, string[]>;
  /** Instruções em linguagem natural para o gestor da clínica. */
  onboardingInstructions: string;
  /** Origem da análise (heurística local por padrão). */
  source: 'heuristic' | 'llm';
}

/**
 * Analisa a topologia da rede, separa estações de trabalho de dispositivos IoT
 * (câmeras, Smart TVs) e sugere um IP estático livre para o gateway.
 *
 * MVP (plug-and-play): 100% heurístico e offline — nenhuma chamada externa,
 * nenhum custo, roda no próprio Raspberry Pi.
 *
 * Escala (opcional): para refinar a classificação com IA, plugue um LLM local
 * open source (ex.: Ollama) ou qualquer API em `refineWithLlm()`. O contrato de
 * saída (SecurityPlan) não muda, então o resto do sistema permanece igual.
 */
@Injectable()
export class AnalyzerService {
  analyze(topology: TopologyDto): SecurityPlan {
    return {
      suggestedGatewayIp: this.pickFreeIp(topology),
      profiles: this.groupByClassification(topology),
      onboardingInstructions: this.defaultInstructions(),
      source: 'heuristic',
    };
  }

  private groupByClassification(topology: TopologyDto): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    for (const dev of topology.devices) {
      const key = dev.classification ?? 'unknown';
      (groups[key] ??= []).push(dev.ip);
    }
    return groups;
  }

  private pickFreeIp(topology: TopologyDto): string | null {
    const used = new Set(topology.devices.map((d) => d.ip));
    const base = (topology.gateway ?? '192.168.1.1').split('.').slice(0, 3);
    for (let host = 2; host < 254; host++) {
      const candidate = [...base, String(host)].join('.');
      if (!used.has(candidate)) return candidate;
    }
    return null;
  }

  private defaultInstructions(): string {
    return (
      'Equipamento online. Para ativar a segurança LGPD, desative o DHCP do ' +
      'seu roteador e deixe o DNS Shield distribuir os IPs da rede. Siga as 3 ' +
      'telas enviadas por WhatsApp.'
    );
  }
}
