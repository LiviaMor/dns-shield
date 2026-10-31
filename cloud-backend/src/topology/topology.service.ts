import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { AnalyzerService, SecurityPlan } from './analyzer.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { TopologyDto } from './dto/topology.dto';

export interface TopologyResult {
  stored: boolean;
  plan: SecurityPlan;
}

@Injectable()
export class TopologyService {
  constructor(
    private readonly db: DbService,
    private readonly analyzer: AnalyzerService,
    private readonly onboarding: OnboardingService,
  ) {}

  /**
   * Ingesta a topologia descoberta no Edge:
   * 1. persiste no banco (escopado por tenant);
   * 2. gera o plano de segurança / IP do gateway;
   * 3. registra as instruções de onboarding (outbox -> WhatsApp).
   */
  async ingest(tenantId: string, topology: TopologyDto): Promise<TopologyResult> {
    this.db.put(tenantId, `TOPOLOGY#${topology.scanned_at}`, {
      type: 'topology',
      cidr: topology.cidr,
      gateway: topology.gateway ?? null,
      deviceCount: topology.devices.length,
      devices: topology.devices,
    });

    const plan = await this.analyzer.analyze(topology);

    this.onboarding.enqueueInstructions(tenantId, plan);

    return { stored: true, plan };
  }

  history(tenantId: string): Record<string, unknown>[] {
    return this.db.queryByPrefix(tenantId, 'TOPOLOGY#');
  }
}
