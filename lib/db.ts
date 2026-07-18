import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// @neondatabase/serverless — Vercel serverless için (mistakes.md #5)
const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, { schema })
