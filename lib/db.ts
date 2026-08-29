import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { requireDatabaseUrl } from './env';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let cached: Db | null = null;

export function getDb(): Db {
  if (!cached) {
    cached = drizzle(neon(requireDatabaseUrl()), { schema });
  }
  return cached;
}
