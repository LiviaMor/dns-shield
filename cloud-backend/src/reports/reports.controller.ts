import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantId } from '../common/tenant.decorator';
import { ReportsService, ThreatReport } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('latest')
  latest(@TenantId() tenantId: string): ThreatReport | null {
    return this.service.latest(tenantId);
  }

  @Post()
  save(
    @TenantId() tenantId: string,
    @Body() report: ThreatReport,
  ): { saved: true } {
    this.service.save(tenantId, report);
    return { saved: true };
  }
}
