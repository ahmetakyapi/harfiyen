import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'

// ─── Users ────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').notNull().unique(),
  name:      text('name'),
  image:     text('image'),
  role:      text('role').notNull().default('user'), // 'user' | 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Proje tablolarını buraya ekle ────────────────────────────────────────
// export const posts = pgTable('posts', { ... })

// ─── Tip çıkarımı ─────────────────────────────────────────────────────────
export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
