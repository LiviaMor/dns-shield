import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { SecurityPlan } from '../topology/analyzer.service';

/**
 * Registra as instruções de onboarding numa "outbox" (padrão transactional
 * outbox) dentro do próprio banco. Um worker/cron entrega as mensagens pendentes
 * via WhatsApp (ex.: Meta Cloud API / Evolution API open source).
 *
 * MVP: sem fila externa, sem custo — a outbox vive no SQLite.
 * Escala: a mesma outbox pode ser drenada por Redis/SQS/RabbitMQ sem mudar o
 * domínio.
 */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly db: DbService) {}

  enqueueInstructions(tenantId: string, plan: SecurityPlan): { enqueued: true } {
    const message = {
      type: 'outbox',
      status: 'pending',
      channel: 'whatsapp',
      suggestedGatewayIp: plan.suggestedGatewayIp,
      instructions: plan.onboardingInstructions,
      source: plan.source,
      createdAt: new Date().toISOString(),
    };
    this.db.put(tenantId, `OUTBOX#${message.createdAt}`, message);
    this.logger.log(`Instruções de onboarding registradas para ${tenantId}`);
    return { enqueued: true };
  }

  pending(tenantId: string): Record<string, unknown>[] {
    return this.db
      .queryByPrefix(tenantId, 'OUTBOX#')
      .filter((m) => m.status === 'pending');
  }
}
