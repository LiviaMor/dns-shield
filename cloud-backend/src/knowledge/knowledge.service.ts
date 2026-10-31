import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface Profile {
  id: string;
  nome: string;
  descricao: string;
  publico: string;
  categoriasBloqueadas: string[];
  blocklists: string[];
  [key: string]: unknown;
}

export interface KnowledgeVersion {
  version: string;
  updatedAt: string;
  profiles: string[];
  threatDocs: string[];
  compliance: string[];
}

/**
 * Serve a BASE DE CONHECIMENTO CENTRAL (knowledge-base/):
 *   - version:  qual a versão atual (clientes comparam e baixam se mudou);
 *   - profiles: perfis de bloqueio (padrão, família/controle parental, clínica);
 *   - threat/compliance docs: texto usado como contexto (RAG) para o Llama.
 *
 * É a "inteligência que desce": o cliente consome atualizações daqui; nenhum
 * dado do cliente é armazenado ou lido por este serviço.
 */
@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private readonly baseDir =
    process.env.KNOWLEDGE_DIR ?? join(process.cwd(), '..', 'knowledge-base');

  getVersion(): KnowledgeVersion {
    return this.readJson<KnowledgeVersion>('version.json');
  }

  listProfiles(): Profile[] {
    const dir = join(this.baseDir, 'profiles');
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as Profile);
  }

  getProfile(id: string): Profile {
    const profile = this.listProfiles().find((p) => p.id === id);
    if (!profile) {
      throw new NotFoundException(`Perfil '${id}' não encontrado.`);
    }
    return profile;
  }

  /**
   * Retorna o texto dos documentos de ameaças/compliance, para uso como
   * contexto (RAG) do Llama. Concatena os .md das pastas threats/ e compliance/.
   */
  getKnowledgeContext(): string {
    const parts: string[] = [];
    for (const sub of ['threats', 'compliance']) {
      const dir = join(this.baseDir, sub);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
        parts.push(readFileSync(join(dir, f), 'utf-8'));
      }
    }
    return parts.join('\n\n---\n\n');
  }

  private readJson<T>(rel: string): T {
    const path = join(this.baseDir, rel);
    if (!existsSync(path)) {
      throw new NotFoundException(`Arquivo da base não encontrado: ${rel}`);
    }
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  }
}
