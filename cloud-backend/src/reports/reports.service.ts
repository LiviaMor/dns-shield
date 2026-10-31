import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';

export interface ThreatReport {
  periodStart: string;
  periodEnd: string;
  totalQueries: number;
  blockedQueries: number;
  blockRatePct: number;
  topBlockedDomains: { domain: string; hits: number }[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly db: DbService) {}

  latest(tenantId: string): ThreatReport | null {
    const items = this.db.queryByPrefix(tenantId, 'REPORT#', 1);
    const item = items[0];
    return item ? (item as unknown as ThreatReport) : null;
  }

  /** Persiste um relatório puxado do Pi-hole (via DDNS) para a clínica. */
  save(tenantId: string, report: ThreatReport): void {
    this.db.put(tenantId, `REPORT#${report.periodEnd}`, {
      type: 'report',
      ...report,
    });
  }
}
