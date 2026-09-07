import { createClient } from '@libsql/client/web';
import { TursoDatabase } from './turso-adapter';
import { blobMedia } from './blob-adapter';

let database: D1Database | undefined;

// Lazy initialization keeps deployment builds independent of secret values.
function getDatabase() {
  if (database) return database;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return undefined;
  if (!/^(libsql|https):\/\//.test(url)) throw new Error('Turso requires a secure remote database URL');
  database = new TursoDatabase(createClient({ url, authToken })) as unknown as D1Database;
  return database;
}

// Node deployments read server-only environment variables at runtime.
export const env: Record<string, unknown> & { DB?: D1Database; MEDIA?: R2Bucket } = {
  ...process.env,
  get DB() { return getDatabase(); },
  get MEDIA() {
    return process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN
      ? blobMedia as unknown as R2Bucket : undefined;
  },
};
