import {
  boolean, date, index, integer, jsonb, pgEnum, pgTable, serial, text,
  timestamp, uniqueIndex, varchar,
} from 'drizzle-orm/pg-core';

export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'completed']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 20 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  lastStreakDate: date('last_streak_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const puzzles = pgTable('puzzles', {
  id: serial('id').primaryKey(),
  publicId: varchar('public_id', { length: 32 }).notNull().unique(),
  date: date('date').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  size: integer('size').notNull(),
  black: jsonb('black').notNull(),        // boolean[][]
  entries: jsonb('entries').notNull(),    // Entry[] — cevapsız, istemciye gidebilir
  solution: jsonb('solution').notNull(),  // (string|null)[][] — SADECE sunucu
  wordHashes: jsonb('word_hashes').notNull(), // Record<`${no}:${dir}`, string>
  words: jsonb('words').notNull(),        // string[] — SADECE sunucu (tekrar kaçınma penceresi)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('puzzles_date_difficulty').on(t.date, t.difficulty)]);

export const playSessions = pgTable('play_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  anonId: varchar('anon_id', { length: 64 }),
  puzzleId: integer('puzzle_id').notNull().references(() => puzzles.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  hintCount: integer('hint_count').notNull().default(0),
  penaltyMs: integer('penalty_ms').notNull().default(0),
  status: sessionStatusEnum('status').notNull().default('active'),
  isRanked: boolean('is_ranked').notNull().default(false),
  flagged: boolean('flagged').notNull().default(false),
}, (t) => [
  index('sessions_leaderboard').on(t.puzzleId, t.isRanked, t.durationMs),
  index('sessions_identity').on(t.userId, t.puzzleId),
]);
