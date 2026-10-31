import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Camada de persistência do DNS Shield.
 *
 * MVP (plug-and-play): SQLite em arquivo local — zero config, roda no Raspberry
 * Pi sem servidor de banco externo.
 *
 * Escala (opcional): o modelo é uma single-table chave/valor escopada por
 * tenant (`pk` + `sk` + `data` JSON). Esse mesmo contrato mapeia 1:1 para
 * Postgres (JSONB) ou DynamoDB, então migrar é só trocar esta classe —
 * nenhum serviço de domínio precisa mudar.
 *
 *   pk = TENANT#<tenantId>
 *   sk = <entidade>#<id>   (ex.: TOPOLOGY#2026-..., REPORT#..., OUTBOX#...)
 */
@Injectable()
export class DbService implements OnModuleInit {
  private readonly logger = new Logger(DbService.name);
  private db!: Database.Database;

  onModuleInit(): void {
    const path = process.env.DB_PATH ?? './data/dns-shield.db';
    mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        pk         TEXT NOT NULL,
        sk         TEXT NOT NULL,
        data       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (pk, sk)
      );
    `);
    this.logger.log(`SQLite pronto em ${path}`);
  }

  put(tenantId: string, sk: string, data: Record<string, unknown>): void {
    this.db
      .prepare(
        `INSERT INTO items (pk, sk, data) VALUES (?, ?, ?)
         ON CONFLICT(pk, sk) DO UPDATE SET data = excluded.data`,
      )
      .run(`TENANT#${tenantId}`, sk, JSON.stringify(data));
    this.logger.debug(`put TENANT#${tenantId} / ${sk}`);
  }

  queryByPrefix(
    tenantId: string,
    skPrefix: string,
    limit = 50,
  ): Record<string, unknown>[] {
    const rows = this.db
      .prepare(
        `SELECT data FROM items
         WHERE pk = ? AND sk LIKE ?
         ORDER BY sk DESC
         LIMIT ?`,
      )
      .all(`TENANT#${tenantId}`, `${skPrefix}%`, limit) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Record<string, unknown>);
  }
}
