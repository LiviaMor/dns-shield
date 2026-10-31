import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantId } from '../common/tenant.decorator';
import { TopologyService, TopologyResult } from './topology.service';
import { TopologyDto } from './dto/topology.dto';

@Controller('topology')
export class TopologyController {
  constructor(private readonly service: TopologyService) {}

  /** Recebe a topologia enviada pelo network_discovery.py do Edge. */
  @Post()
  ingest(
    @TenantId() tenantId: string,
    @Body() topology: TopologyDto,
  ): Promise<TopologyResult> {
    return this.service.ingest(tenantId, topology);
  }

  /** Histórico de varreduras da clínica. */
  @Get()
  history(@TenantId() tenantId: string): Record<string, unknown>[] {
    return this.service.history(tenantId);
  }
}
