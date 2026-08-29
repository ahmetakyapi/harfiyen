import { describe, expect, it } from 'vitest';
import { createTestDb } from '@/tests/helpers/testDb';
import { loadBank } from '@/lib/content';
import { buildPuzzleRow } from '@/lib/generator/assign';
import { generateWithRetries } from '@/lib/generator/generator';
import { puzzles } from '@/lib/schema';
import { CLIENT_PUZZLE_COLUMNS, getClientPuzzle } from './puzzle';
import { finishSession, revealLetter, startSession } from './session';
import { users } from '@/lib/schema';

// Projenin en kritik değişmezi (CLAUDE.md): cevaplar istemciye ASLA gitmez.
// Bugüne kadar bunu koruyan tek şey bir yorum satırıydı — biri sorguyu
// `db.select()` haline getirse `solution` RSC payload'una sessizce gömülür,
// testler ve tip denetimi yeşil kalırdı.
describe('istemciye giden bulmaca verisi', () => {
  it('solution ve words kolonlarını asla içermez', async () => {
    expect(CLIENT_PUZZLE_COLUMNS).not.toContain('solution');
    expect(CLIENT_PUZZLE_COLUMNS).not.toContain('words');

    const db = await createTestDb();
    const generated = generateWithRetries({ difficulty: 'easy', bank: loadBank(), seed: 7 });
    await db.insert(puzzles).values(await buildPuzzleRow(generated, '2026-01-01', 'easy'));

    const client = await getClientPuzzle(db, '2026-01-01', 'easy');
    expect(client).not.toBeNull();
    const keys = Object.keys(client as object);
    expect(keys).not.toContain('solution');
    expect(keys).not.toContain('words');
    // Serileştirilmiş hâlinde de hiçbir cevap kelimesi geçmemeli.
    const json = JSON.stringify(client);
    for (const w of generated.words) expect(json).not.toContain(w.word);
  });

  it('oturum uçlarının döndürdüğü hiçbir alan çözümü taşımaz', async () => {
    const db = await createTestDb();
    const generated = generateWithRetries({ difficulty: 'easy', bank: loadBank(), seed: 11 });
    const [p] = await db.insert(puzzles)
      .values(await buildPuzzleRow(generated, '2026-01-01', 'easy')).returning();
    const [u] = await db.insert(users)
      .values({ username: 'gizli', passwordHash: 'x' }).returning();
    const identity = { userId: u.id, anonId: null };

    const s = await startSession(db, { puzzleId: p.id, identity, now: new Date('2026-01-01T10:00:00Z') });
    expect(JSON.stringify(s)).not.toContain(generated.words[0].word);

    // revealLetter tek HARF döner, kelime ya da ızgara değil.
    const cell = generated.words[0];
    const hint = await revealLetter(db, { sessionId: s.sessionId, identity, row: cell.row, col: cell.col });
    expect(hint.letter).toHaveLength(1);

    const done = await finishSession(db, {
      sessionId: s.sessionId, identity, letters: generated.solution,
    });
    const json = JSON.stringify(done);
    for (const w of generated.words) expect(json).not.toContain(w.word);
  });
});
