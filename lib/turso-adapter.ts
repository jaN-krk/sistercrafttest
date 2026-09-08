import type { Client, InValue, ResultSet } from '@libsql/client';
import schema from '../drizzle/0000_overjoyed_sinister_six.sql?raw';
import refunds from '../drizzle/0001_windy_banshee.sql?raw';
import outbox from '../drizzle/0002_sad_shockwave.sql?raw';
import notifications from '../drizzle/0003_tough_iron_monger.sql?raw';
import customers from '../drizzle/0004_groovy_riptide.sql?raw';

const migrations = [
  ['0000_overjoyed_sinister_six', schema],
  ['0001_windy_banshee', refunds],
  ['0002_sad_shockwave', outbox],
  ['0003_tough_iron_monger', notifications],
  ['0004_groovy_riptide', customers],
] as const;

function result<T>(value: ResultSet): D1Result<T> {
  return {
    success: true,
    results: value.rows.map(row => Object.fromEntries(value.columns.map(column => [column, row[column]]))) as T[],
    meta: {
      changes: value.rowsAffected,
      last_row_id: Number(value.lastInsertRowid ?? 0),
      duration: 0, rows_read: value.rows.length, rows_written: value.rowsAffected,
      size_after: 0, changed_db: value.rowsAffected > 0,
    },
  };
}

// Keep the store's bound SQLite statements and atomic stock transactions intact.
// No database token, query endpoint or administration API is exposed to the client.
export class TursoDatabase {
  private initialized?: Promise<void>;
  constructor(readonly client: Client) {}

  async ready() {
    this.initialized ??= this.migrate().catch(error => {
      this.initialized = undefined;
      throw error;
    });
    await this.initialized;
  }

  private async migrate() {
    const transaction = await this.client.transaction('write');
    try {
      await transaction.execute('CREATE TABLE IF NOT EXISTS sistercraft_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
      const applied = await transaction.execute('SELECT name FROM sistercraft_migrations');
      const names = new Set(applied.rows.map(row => row.name));
      for (const [name, source] of migrations) {
        if (names.has(name)) continue;
        // Splitting on semicolons would destroy the existing stock/email triggers.
        await transaction.batch(source.split('--> statement-breakpoint').map(sql => sql.trim()).filter(Boolean));
        await transaction.execute({ sql: 'INSERT INTO sistercraft_migrations VALUES (?, ?)', args: [name, Date.now()] });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      transaction.close();
    }
  }

  prepare(sql: string) { return new TursoStatement(this, sql); }

  async batch<T>(statements: TursoStatement[]): Promise<D1Result<T>[]> {
    await this.ready();
    if (statements.some(statement => statement.database !== this)) throw new Error('Mixed database batch');
    if (!statements.length) return [];
    const values = await this.client.batch(statements.map(statement => ({ sql: statement.sql, args: statement.values })), 'write');
    return values.map(value => result<T>(value));
  }
}

class TursoStatement {
  constructor(readonly database: TursoDatabase, readonly sql: string, readonly values: InValue[] = []) {}
  bind(...values: InValue[]) { return new TursoStatement(this.database, this.sql, values); }
  private async execute() {
    await this.database.ready();
    return this.database.client.execute({ sql: this.sql, args: this.values });
  }
  async all<T = Record<string, unknown>>() { return result<T>(await this.execute()); }
  async run<T = Record<string, unknown>>() { return result<T>(await this.execute()); }
  async first<T = Record<string, unknown>>(column?: string): Promise<T | null> {
    const value = (await this.all<Record<string, unknown>>()).results[0];
    if (!value) return null;
    if (column && !(column in value)) throw new Error('Unknown result column');
    return (column ? value[column] : value) as T;
  }
  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[]> {
    const value = await this.execute();
    const rows = value.rows.map(row => value.columns.map(column => row[column]));
    return (options?.columnNames ? [value.columns, ...rows] : rows) as T[];
  }
}
