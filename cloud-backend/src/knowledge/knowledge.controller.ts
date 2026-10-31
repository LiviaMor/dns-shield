import { Controller, Get, Param } from '@nestjs/common';
import {
  KnowledgeService,
  Profile,
  KnowledgeVersion,
} from './knowledge.service';

/**
 * Endpoints de distribuição da base de conhecimento central.
 * Os aparelhos (edge) consultam estes endpoints para baixar atualizações —
 * a "inteligência que desce". Nenhum dado do cliente trafega aqui.
 */
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  /** Versão atual da base (o edge compara e baixa se mudou). */
  @Get('version')
  version(): KnowledgeVersion {
    return this.service.getVersion();
  }

  /** Lista os perfis de bloqueio disponíveis (padrão, família, clínica). */
  @Get('profiles')
  profiles(): Profile[] {
    return this.service.listProfiles();
  }

  /** Detalhe de um perfil (ex.: familia-controle-parental). */
  @Get('profiles/:id')
  profile(@Param('id') id: string): Profile {
    return this.service.getProfile(id);
  }
}
