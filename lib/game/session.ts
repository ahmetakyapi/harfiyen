import { and, eq, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { gameDay } from '@/lib/date';
import type { Db } from '@/lib/db';
import { isUniqueViolation } from '@/lib/pgError';
import { playSessions, puzzles } from '@/lib/schema';
import { HINT_PENALTY_MS, type Entry } from '@/lib/types';
import { applyStreak, readStreak, type StreakState } from './streak';

export type Identity = { userId: number | null; anonId: string | null };

export class SessionError extends Error {
  constructor(public code: 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_ACTIVE' | 'INVALID_CELL' | 'PUZZLE_NOT_FOUND' | 'HINT_LIMIT') {
    super(code);
  }
}

const MIN_HUMAN_MS = 5_000;

// duration_ms int4 (yaklaşık 24,8 gün). Terk edilmiş bir oturum bu sınırı
// aşarsa UPDATE "numeric out of range" ile patlar; oturum aktif kaldığı için
// sessions_active_identity yüzünden oyuncu o bulmacayı BİR DAHA açamaz.
// Tavan, sıralamayı zaten ilgilendirmeyen bu uç durumu zararsız kılar.
const MAX_DURATION_MS = 2_000_000_000;

// Harf açmanın oturum başına sert tavanı: beyaz hücrelerin bu oranı. Ceza tek
// başına yeterli bir fren değildi — sıralamayı zaten umursamayan biri, ipucu
// ucunu ardı ardına çağırıp çözüm ızgarasını hücre hücre boşaltabiliyordu.
// %25, gerçekten takılan bir oyuncunun ihtiyacının çok üstünde.
const MAX_HINT_RATIO = 0.25;

function identityFilter(identity: Identity) {
  return identity.userId !== null
    ? eq(playSessions.userId, identity.userId)
    : and(isNull(playSessions.userId), eq(playSessions.anonId, identity.anonId ?? ''));
}

function assertOwnership(row: typeof playSessions.$inferSelect, identity: Identity): void {
  const owns = identity.userId !== null
    ? row.userId === identity.userId
    : row.userId === null && row.anonId !== null && row.anonId === identity.anonId;
  if (!owns) throw new SessionError('FORBIDDEN');
}

export type StartResult = {
  sessionId: number; startedAt: string; serverNow: string; existing: boolean;
  status: 'active' | 'completed'; hintCount: number; penaltyMs: number;
  durationMs: number | null; isRanked: boolean;
};

export async function startSession(db: Db, opts: {
  puzzleId: number; identity: Identity; replay?: boolean; now?: Date;
}): Promise<StartResult> {
  const now = opts.now ?? new Date();
  const [puzzle] = await db.select({ id: puzzles.id, date: puzzles.date }).from(puzzles)
    .where(eq(puzzles.id, opts.puzzleId));
  if (!puzzle) throw new SessionError('PUZZLE_NOT_FOUND');
  // Henüz yayınlanmamış bulmaca YOK sayılır. Sayfa katmanı gelecek tarihleri
  // zaten notFound() ile kesiyor ama API o kapıdan geçmiyordu: puzzles.id
  // serial olduğundan tahmin edilebilir, üstelik sıralama ucu id'yi doğrudan
  // veriyordu. Oturum açılabilseydi /api/session/hint yarınki bulmacanın
  // bütün harflerini hücre hücre açardı. 404 gibi davranmak bulmacanın
  // varlığını da sızdırmaz.
  if (puzzle.date > gameDay(now)) throw new SessionError('PUZZLE_NOT_FOUND');

  const mine = await db.select().from(playSessions)
    .where(and(eq(playSessions.puzzleId, opts.puzzleId), identityFilter(opts.identity)));
  const active = mine.find((s) => s.status === 'active');
  const completed = mine.find((s) => s.status === 'completed');

  const toResult = (row: typeof playSessions.$inferSelect, existing: boolean): StartResult => ({
    sessionId: row.id, startedAt: row.startedAt.toISOString(), serverNow: now.toISOString(),
    existing, status: row.status, hintCount: row.hintCount, penaltyMs: row.penaltyMs,
    durationMs: row.durationMs, isRanked: row.isRanked,
  });

  const isToday = puzzle.date === gameDay(now);
  if (active) {
    // Açık bir "Tekrar Oyna" isteği, GEÇMİŞ bir güne ait aktif oturumu
    // sıfırdan başlatır: yoksa oyuncu, günler önce açık bıraktığı sayaçla
    // (ör. 3 gün 14 saat) karşılaşırdı. BUGÜNÜN oturumu asla sıfırlanmaz —
    // aksi hâlde ipuçlarına bakıp sayacı sıfırlamak bir istismar olurdu.
    if (!opts.replay || isToday) return toResult(active, true);
    const [reset] = await db.update(playSessions)
      .set({ startedAt: now, hintCount: 0, penaltyMs: 0, isRanked: false })
      .where(eq(playSessions.id, active.id))
      .returning();
    return toResult(reset, false);
  }
  if (completed && !opts.replay) return toResult(completed, true);

  const isRanked = opts.identity.userId !== null && isToday && !completed;
  try {
    const [row] = await db.insert(playSessions).values({
      userId: opts.identity.userId, anonId: opts.identity.userId ? null : opts.identity.anonId,
      puzzleId: opts.puzzleId, startedAt: now, isRanked,
    }).returning();
    return toResult(row, false);
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    // Race: başka bir eşzamanlı çağrı bizden önce aktif oturumu ekledi
    // (sessions_active_identity partial unique index'i tetiklendi).
    // Var olan aktif oturumu okuyup onu dön — iki aktif oturum asla oluşmaz.
    const raced = await db.select().from(playSessions)
      .where(and(eq(playSessions.puzzleId, opts.puzzleId), identityFilter(opts.identity), eq(playSessions.status, 'active')));
    const winner = raced[0];
    if (!winner) throw err;
    return toResult(winner, true);
  }
}

async function loadOwnedSession(db: Db, sessionId: number, identity: Identity) {
  const [row] = await db.select().from(playSessions).where(eq(playSessions.id, sessionId));
  if (!row) throw new SessionError('NOT_FOUND');
  assertOwnership(row, identity);
  return row;
}

/** Seçili hücrenin harfini açar ve süreye ceza ekler (arayüzde "Harf Aç"). */
export async function revealLetter(db: Db, opts: {
  sessionId: number; identity: Identity; row: number; col: number; now?: Date;
}): Promise<{ letter: string; hintCount: number; penaltyMs: number }> {
  const session = await loadOwnedSession(db, opts.sessionId, opts.identity);
  if (session.status !== 'active') throw new SessionError('NOT_ACTIVE');
  const [puzzle] = await db.select({ solution: puzzles.solution, date: puzzles.date }).from(puzzles)
    .where(eq(puzzles.id, session.puzzleId));
  if (!puzzle) throw new SessionError('PUZZLE_NOT_FOUND');
  // Derinlemesine savunma: oturum bir şekilde açılmış olsa bile yayınlanmamış
  // bulmacanın harfi açılmaz (bkz. startSession'daki aynı kapı).
  if (puzzle.date > gameDay(opts.now ?? new Date())) throw new SessionError('PUZZLE_NOT_FOUND');
  const solution = puzzle.solution as (string | null)[][];
  const whiteCells = solution.reduce(
    (n, row) => n + row.reduce((m, cell) => m + (cell === null ? 0 : 1), 0), 0,
  );
  if (session.hintCount >= Math.max(1, Math.floor(whiteCells * MAX_HINT_RATIO))) {
    throw new SessionError('HINT_LIMIT');
  }
  const letter = solution[opts.row]?.[opts.col] ?? null;
  if (letter === null) throw new SessionError('INVALID_CELL');
  const [updated] = await db.update(playSessions)
    .set({
      hintCount: sql`${playSessions.hintCount} + 1`,
      penaltyMs: sql`${playSessions.penaltyMs} + ${HINT_PENALTY_MS}`,
    })
    .where(eq(playSessions.id, session.id))
    .returning({ hintCount: playSessions.hintCount, penaltyMs: playSessions.penaltyMs });
  return { letter, hintCount: updated.hintCount, penaltyMs: updated.penaltyMs };
}

/** Bitiş ekranının "ham süre"yi anlama dönüştüren bağlamı. */
export type FinishStats = {
  /** Bu bulmacayı sıralamalı bitirenlerin medyan süresi (kimse yoksa null). */
  medianMs: number | null;
  /** Oyuncunun geçtiği çözücü yüzdesi (0-100). Tek çözücü varsa null. */
  fasterThanPct: number | null;
  /** Bu bulmacayı sıralamalı bitiren toplam oyuncu sayısı (oyuncu dahil). */
  solverCount: number;
  /** Aynı zorluktaki ÖNCEKİ en iyi süre — yalnızca sıralı oyunlarda. */
  previousBestMs: number | null;
  /** Bu oyun kişisel rekoru kırdı mı. */
  isPersonalBest: boolean;
};

export type FinishResult =
  | { correct: false }
  | {
      correct: true; durationMs: number; isRanked: boolean; rank: number | null;
      alreadyCompleted: boolean;
      // Bitiş ekranında seriyi göstermek için — günlük oyunun en güçlü geri
      // dönüş kancası. Sıralamaya girmeyen (arşiv/pratik) oyunlarda null.
      streak: { current: number; best: number } | null;
      stats: FinishStats;
    };

export async function finishSession(db: Db, opts: {
  sessionId: number; identity: Identity; letters: (string | null)[][]; now?: Date;
}): Promise<FinishResult> {
  const now = opts.now ?? new Date();
  const session = await loadOwnedSession(db, opts.sessionId, opts.identity);

  if (session.status === 'completed') {
    const durationMs = session.durationMs ?? 0;
    const [rank, streak, stats] = await Promise.all([
      session.isRanked ? rankOf(db, session.puzzleId, durationMs, session.submittedAt ?? now) : Promise.resolve(null),
      streakFor(db, session.isRanked ? session.userId : null),
      finishStats(db, session, durationMs),
    ]);
    return {
      correct: true, durationMs,
      isRanked: session.isRanked, rank, alreadyCompleted: true,
      streak, stats,
    };
  }

  const [puzzle] = await db.select({ solution: puzzles.solution, date: puzzles.date }).from(puzzles)
    .where(eq(puzzles.id, session.puzzleId));
  if (!puzzle) throw new SessionError('PUZZLE_NOT_FOUND');
  if (puzzle.date > gameDay(now)) throw new SessionError('PUZZLE_NOT_FOUND');
  const solution = puzzle.solution as (string | null)[][];

  const matches = solution.every((rowArr, r) =>
    rowArr.every((cell, c) => (opts.letters[r]?.[c] ?? null) === cell),
  );
  if (!matches) return { correct: false };

  const elapsed = now.getTime() - session.startedAt.getTime();
  const durationMs = Math.min(elapsed + session.penaltyMs, MAX_DURATION_MS);

  // isRanked eskiden YALNIZCA oturum açılırken hesaplanıyordu. Oturum başladığı
  // güne bağlı olduğundan (spec §8) dün açılmış bir oturum bugün bitirilebilir;
  // o zaman 24 saati aşan bir süre "sıralı" olarak tabloya yazılıyordu. Sıralama
  // GÜNLÜK bir yarış: bulmacanın kendi oyun günü kapandıysa sonuç pratik sayılır.
  const stillRanked = session.isRanked && puzzle.date === gameDay(now);

  await db.update(playSessions).set({
    status: 'completed', submittedAt: now, durationMs, isRanked: stillRanked,
    flagged: elapsed < MIN_HUMAN_MS,
  }).where(eq(playSessions.id, session.id));

  // İstatistikler oturum "completed" YAZILDIKTAN SONRA okunur: medyan ve
  // çözücü sayısı oyuncunun kendisini de içerir. Kişisel rekor sorgusu bu
  // satırı id ile dışladığı için kendi süremiz "önceki en iyi"ye karışmaz.
  // Böylece ilk gönderim ile idempotent tekrar aynı sonucu verir.
  const stats = await finishStats(db, { ...session, isRanked: stillRanked }, durationMs);
  if (elapsed < MIN_HUMAN_MS) {
    // spec §4: v1'de otomatik ban yok, yalnızca loglanır.
    console.warn(
      `[harfiyen] şüpheli süre: session=${session.id} user=${session.userId ?? 'anon'} ` +
      `puzzle=${session.puzzleId} elapsed=${elapsed}ms`,
    );
  }

  let rank: number | null = null;
  let streak: StreakState | null = null;
  if (stillRanked) {
    rank = await rankOf(db, session.puzzleId, durationMs, now);
    if (session.userId !== null) streak = await applyStreak(db, session.userId, puzzle.date);
  }
  return {
    correct: true, durationMs, isRanked: stillRanked, rank, alreadyCompleted: false,
    streak: toStreakDto(streak), stats,
  };
}

/** Ham süreyi anlama dönüştüren bağlam: günün medyanı, yüzdelik ve kişisel rekor. */
async function finishStats(
  db: Db, session: typeof playSessions.$inferSelect, durationMs: number,
): Promise<FinishStats> {
  const completedRanked = and(
    eq(playSessions.puzzleId, session.puzzleId),
    eq(playSessions.isRanked, true),
    eq(playSessions.status, 'completed'),
  );

  const wantsPersonalBest = session.isRanked && session.userId !== null;
  const [difficultyRow] = wantsPersonalBest
    ? await db.select({ difficulty: puzzles.difficulty }).from(puzzles)
        .where(eq(puzzles.id, session.puzzleId))
    : [undefined];

  const [dist, prev] = await Promise.all([
    // Dağılım tek turda: medyan, toplam çözücü ve bizden yavaş olan sayısı.
    // Kendi oturumumuz henüz 'completed' değilse sayıya girmez; her iki durumu
    // da aşağıda normalize ediyoruz.
    db.select({
      median: sql<number | null>`percentile_cont(0.5) within group (order by ${playSessions.durationMs})`,
      total: sql<number>`count(*)`,
      slower: sql<number>`count(*) filter (where ${playSessions.durationMs} > ${durationMs})`,
      mine: sql<number>`count(*) filter (where ${playSessions.id} = ${session.id})`,
    }).from(playSessions).where(completedRanked),
    // Kişisel rekor yalnızca sıralı (günlük) oyunlarda anlamlı: arşivde geçmiş
    // bir bulmacayı rahat rahat çözmek "rekor" sayılmamalı.
    wantsPersonalBest && difficultyRow
      ? db.select({ best: sql<number | null>`min(${playSessions.durationMs})` })
          .from(playSessions)
          .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
          .where(and(
            eq(playSessions.userId, session.userId as number),
            eq(playSessions.status, 'completed'),
            eq(playSessions.isRanked, true),
            ne(playSessions.id, session.id),
            eq(puzzles.difficulty, difficultyRow.difficulty),
          ))
      : Promise.resolve([{ best: null }]),
  ]);

  const row = dist[0];
  const median = row?.median === null || row?.median === undefined ? null : Math.round(Number(row.median));
  const others = Number(row?.total ?? 0) - Number(row?.mine ?? 0);
  const solverCount = others + 1;
  const slower = Number(row?.slower ?? 0);
  const fasterThanPct = others > 0 ? Math.round((slower / others) * 100) : null;

  const previousBestMs = prev[0]?.best === null || prev[0]?.best === undefined
    ? null : Number(prev[0].best);
  return {
    medianMs: median,
    fasterThanPct,
    solverCount,
    previousBestMs,
    isPersonalBest: previousBestMs !== null && durationMs < previousBestMs,
  };
}

/** Bitişte gösterilen kelime dökümü: numara, yön, ipucu ve CEVAP. */
export type SolvedEntry = Entry & { word: string };

/**
 * Cevapları YALNIZCA kendi TAMAMLANMIŞ oturumunu bitirmiş oyuncuya açar.
 * Sahiplik kontrolü loadOwnedSession'dan gelir; tamamlanmamış oturumda çağrı
 * NOT_ACTIVE ile reddedilir, yani bu uç bir cevap sızıntısı kanalı değildir.
 */
export async function getSessionWords(db: Db, opts: {
  sessionId: number; identity: Identity;
}): Promise<SolvedEntry[]> {
  const session = await loadOwnedSession(db, opts.sessionId, opts.identity);
  if (session.status !== 'completed') throw new SessionError('NOT_ACTIVE');
  const [puzzle] = await db.select({ entries: puzzles.entries, solution: puzzles.solution })
    .from(puzzles).where(eq(puzzles.id, session.puzzleId));
  if (!puzzle) throw new SessionError('PUZZLE_NOT_FOUND');
  const solution = puzzle.solution as (string | null)[][];
  // Kelime, entries sırasına GÜVENMEDEN çözüm ızgarasından okunur — iki jsonb
  // kolonunun sırası ileride ayrışsa bile döküm doğru kalır.
  return (puzzle.entries as Entry[]).map((e) => {
    let word = '';
    for (let i = 0; i < e.len; i++) {
      const r = e.dir === 'down' ? e.row + i : e.row;
      const c = e.dir === 'across' ? e.col + i : e.col;
      word += solution[r]?.[c] ?? '';
    }
    return { ...e, word };
  });
}

const toStreakDto = (s: StreakState | null): { current: number; best: number } | null =>
  s === null ? null : { current: s.currentStreak, best: s.bestStreak };

/** Tamamlanmış oturuma dönüşte seriyi DB'den okur (idempotent submit yolu). */
async function streakFor(db: Db, userId: number | null): Promise<{ current: number; best: number } | null> {
  if (userId === null) return null;
  return toStreakDto(await readStreak(db, userId));
}

async function rankOf(db: Db, puzzleId: number, durationMs: number, submittedAt: Date): Promise<number> {
  const better = await db.select({ n: sql<number>`count(*)` }).from(playSessions).where(and(
    eq(playSessions.puzzleId, puzzleId),
    eq(playSessions.isRanked, true),
    eq(playSessions.status, 'completed'),
    or(
      lt(playSessions.durationMs, durationMs),
      and(eq(playSessions.durationMs, durationMs), lt(playSessions.submittedAt, submittedAt)),
    ),
  ));
  return Number(better[0].n) + 1;
}
