import { Injectable, Logger } from '@nestjs/common';
import { TopologyDto } from './dto/topology.dto';

export interface SecurityPlan {
  /** IP estático sugerido para o gateway DNS Shield. */
  suggestedGatewayIp: string | null;
  /** Dispositivos agrupados por perfil de segurança. */
  profiles: Record<string, string[]>;
  /** Instruções em linguagem natural para o gestor da clínica. */
  onboardingInstructions: string;
  /** Origem da análise. */
  source: 'heuristic' | 'llm';
}

/**
 * Analisa a topologia da rede, separa estações de trabalho de dispositivos IoT
 * (câmeras, Smart TVs) e sugere um IP estático livre para o gateway.
 *
 * PRIVACIDADE POR DESIGN:
 * Quando habilitado, usa um LLM **local** open source (Llama via Ollama) rodando
 * no próprio dispositivo/infra do cliente. Os dados da rede (IPs, MACs,
 * dispositivos) NUNCA são enviados para uma nuvem de terceiros — a inferência
 * acontece on-premise. Se o LLM estiver indisponível, cai automaticamente na
 * heurística local (o produto nunca quebra e nunca vaza dados).
 *
 * Config (env):
 *   LLM_ENABLED=true|false   (padrão false → só heurística)
 *   LLM_API_URL=http://ollama:11434   (endpoint do Ollama local)
 *   LLM_MODEL=llama3.2       (modelo Llama a usar)
 */
@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);
  private readonly llmEnabled = process.env.LLM_ENABLED === 'true';
  private readonly llmUrl =
    process.env.LLM_API_URL ?? 'http://localhost:11434';
  private readonly llmModel = process.env.LLM_MODEL ?? 'llama3.2';

  async analyze(topology: TopologyDto): Promise<SecurityPlan> {
    // Base heurística: sempre calculada (é o fallback e a fonte dos perfis).
    const base: SecurityPlan = {
      suggestedGatewayIp: this.pickFreeIp(topology),
      profiles: this.groupByClassification(topology),
      onboardingInstructions: this.defaultInstructions(),
      source: 'heuristic',
    };

    if (!this.llmEnabled) {
      return base;
    }

    try {
      const refined = await this.refineWithLlama(topology, base);
      this.logger.log('Análise refinada pelo Llama (local).');
      return refined;
    } catch (err) {
      this.logger.warn(
        `Llama indisponível, usando heurística: ${(err as Error).message}`,
      );
      return base;
    }
  }

  /**
   * Refina o plano usando o Llama local (Ollama). Pede ao modelo instruções de
   * onboarding mais claras/personalizadas, mantendo a classificação heurística
   * como base. A chamada é 100% local — nada sai do dispositivo.
   */
  private async refineWithLlama(
    topology: TopologyDto,
    base: SecurityPlan,
  ): Promise<SecurityPlan> {
    const prompt = this.buildPrompt(topology, base);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(`${this.llmUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.llmModel,
          prompt,
          stream: false,
          options: { temperature: 0.2 },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}`);
      }
      const data = (await res.json()) as { response?: string };
      const text = (data.response ?? '').trim();
      return {
        ...base,
        onboardingInstructions: text || base.onboardingInstructions,
        source: 'llm',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPrompt(topology: TopologyDto, base: SecurityPlan): string {
    const summary = Object.entries(base.profiles)
      .map(([profile, ips]) => `- ${profile}: ${ips.length} dispositivo(s)`)
      .join('\n');
    return [
      'Você é um assistente de segurança de redes para leigos.',
      'Com base no resumo da rede abaixo, escreva uma mensagem curta (até 3',
      'frases), amigável e sem jargão, orientando o cliente a ativar a proteção',
      'conectando os aparelhos na rede Wi-Fi "DNS-Shield". Responda apenas com a',
      'mensagem, em português.',
      '',
      `Gateway sugerido: ${base.suggestedGatewayIp ?? 'n/d'}`,
      'Perfis de dispositivos detectados:',
      summary,
    ].join('\n');
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
      'Equipamento online. Para ativar a proteção, conecte seus aparelhos na ' +
      'rede Wi-Fi "DNS-Shield". Pronto — sua rede já está protegida.'
    );
  }
}
