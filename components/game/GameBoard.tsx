'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { activeEntry, allCellsFilled, cellsOf, entryString, useGameState } from '@/hooks/useGameState';
import { wordHash } from '@/lib/hash';
import { trUpper } from '@/lib/tr';
import { formatTrtDate } from '@/lib/date';
import {
  type ClientPuzzle, type Difficulty, type Letters, hashKey,
} from '@/lib/types';
import { ClueBar } from './ClueBar';
import { FinishDialog } from './FinishDialog';
import { Grid } from './Grid';
import { HowToModal } from './HowToModal';
import { Keyboard } from './Keyboard';
import { Timer } from './Timer';

const LABELS: Record<Difficulty, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

type SessionInfo = {
  sessionId: number; startedAt: string; serverNow: string; existing: boolean;
  status: 'active' | 'completed'; hintCount: number; penaltyMs: number;
  durationMs: number | null; isRanked: boolean;
};
type Phase = 'idle' | 'starting' | 'playing' | 'submitting' | 'done';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`istek başarısız: ${url} ${res.status}`);
  return (await res.json()) as T;
}

export function GameBoard({ puzzle, puzzleNumber, isGuest, isArchive }: {
  puzzle: ClientPuzzle; puzzleNumber: number; isGuest: boolean; isArchive: boolean;
}) {
  const ctx = useMemo(
    () => ({ size: puzzle.size, black: puzzle.black, entries: puzzle.entries }),
    [puzzle],
  );
  const [state, dispatch] = useGameState(ctx);
  const [phase, setPhase] = useState<Phase>('idle');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [penaltyMs, setPenaltyMs] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [result, setResult] = useState<{ durationMs: number; rank: number | null; isRanked: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [correctKeys, setCorrectKeys] = useState<Set<string>>(new Set());
  const submitting = useRef(false);

  const storageKey = session ? `harfiyen:letters:${session.sessionId}` : null;

  const start = useCallback(async () => {
    setPhase('starting');
    setError(null);
    try {
      const s = await post<SessionInfo>('/api/session/start', { puzzleId: puzzle.id, replay: isArchive });
      setSession(s);
      setPenaltyMs(s.penaltyMs);
      setHintCount(s.hintCount);
      if (s.status === 'completed') {
        setResult({ durationMs: s.durationMs ?? 0, rank: null, isRanked: s.isRanked });
        setPhase('done');
        return;
      }
      const saved = localStorage.getItem(`harfiyen:letters:${s.sessionId}`);
      if (saved) dispatch({ type: 'SET_LETTERS', letters: JSON.parse(saved) as Letters });
      setPhase('playing');
    } catch {
      setError('Bağlantı kurulamadı. Tekrar dene.');
      setPhase('idle');
    }
  }, [puzzle.id, isArchive, dispatch]);

  // harfler değiştikçe kaydet + doğru kelimeleri hash ile işaretle
  useEffect(() => {
    if (phase !== 'playing' || !storageKey || !session) return;
    localStorage.setItem(storageKey, JSON.stringify(state.letters));
    let cancelled = false;
    void (async () => {
      const next = new Set<string>();
      for (const e of puzzle.entries) {
        const word = entryString(state.letters, e);
        if (word === null) continue;
        const key = hashKey(e.no, e.dir);
        const h = await wordHash(puzzle.publicId, e.no, e.dir, word);
        if (h === puzzle.wordHashes[key]) next.add(key);
      }
      if (!cancelled) setCorrectKeys(next);
    })();
    return () => { cancelled = true; };
  }, [state.letters, phase, storageKey, session, puzzle]);

  // hepsi doğruysa otomatik submit (yeniden denemeli)
  useEffect(() => {
    if (phase !== 'playing' || !session || submitting.current) return;
    if (!allCellsFilled(ctx, state.letters)) return;
    if (correctKeys.size !== puzzle.entries.length) return;
    submitting.current = true;
    setPhase('submitting');
    void (async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const r = await post<
            { correct: false } | { correct: true; durationMs: number; rank: number | null; isRanked: boolean }
          >('/api/session/submit', { sessionId: session.sessionId, letters: state.letters });
          if (r.correct) {
            setResult({ durationMs: r.durationMs, rank: r.rank, isRanked: r.isRanked });
            setPhase('done');
            if (storageKey) localStorage.removeItem(storageKey);
          } else {
            setError('Bir şeyler uyuşmuyor — kontrol edip tekrar dene.');
            setPhase('playing');
          }
          submitting.current = false;
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        }
      }
      setError('Gönderilemedi. Bağlantını kontrol et — süren sunucuda güvende.');
      setPhase('playing');
      submitting.current = false;
    })();
  }, [correctKeys, phase, session, state.letters, ctx, puzzle.entries.length, storageKey]);

  const hint = useCallback(async () => {
    if (!session || phase !== 'playing') return;
    if (state.letters[state.sel.row][state.sel.col] !== null) return; // dolu hücreye ipucu yok
    try {
      const r = await post<{ letter: string; hintCount: number; penaltyMs: number }>(
        '/api/session/hint',
        { sessionId: session.sessionId, row: state.sel.row, col: state.sel.col },
      );
      setPenaltyMs(r.penaltyMs);
      setHintCount(r.hintCount);
      dispatch({ type: 'REVEAL', row: state.sel.row, col: state.sel.col, letter: r.letter });
    } catch {
      setError('İpucu alınamadı.');
    }
  }, [session, phase, state.sel, state.letters, dispatch]);

  // fiziksel klavye
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') { e.preventDefault(); dispatch({ type: 'DELETE' }); return; }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        dispatch({ type: 'NEXT_ENTRY', delta: e.shiftKey ? -1 : 1 });
        return;
      }
      if (e.key === ' ') { e.preventDefault(); dispatch({ type: 'SELECT', row: state.sel.row, col: state.sel.col }); return; }
      const arrows: Record<string, [number, number]> = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
      };
      if (e.key in arrows) {
        e.preventDefault();
        const [dRow, dCol] = arrows[e.key];
        dispatch({ type: 'MOVE', dRow, dCol });
        return;
      }
      if (e.key.length === 1) dispatch({ type: 'TYPE', letter: trUpper(e.key) });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, dispatch, state.sel]);

  const entry = phase === 'playing' ? activeEntry(ctx, state.sel) : null;
  const activeCells = new Set(entry ? cellsOf(entry).map((c) => `${c.row}:${c.col}`) : []);
  const correctCells = new Set<string>();
  for (const e of puzzle.entries) {
    if (correctKeys.has(hashKey(e.no, e.dir))) {
      for (const c of cellsOf(e)) correctCells.add(`${c.row}:${c.col}`);
    }
  }

  if (phase === 'idle' || phase === 'starting') {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="font-display text-4xl">Harfiyen #{puzzleNumber}</p>
        <p className="mt-2 text-[var(--ink-soft)]">
          {LABELS[puzzle.difficulty]} · {puzzle.size}×{puzzle.size} · {puzzle.entries.length} kelime
          <br />{formatTrtDate(puzzle.date)}
        </p>
        {isArchive && <p className="mt-3 text-sm text-[var(--ink-soft)]">Arşiv oyunu — sıralamaya girmez.</p>}
        <p className="mt-3 text-sm text-[var(--ink-soft)]">Süre "Başla" dediğin an işlemeye başlar.</p>
        {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}
        <button type="button" onClick={start} disabled={phase === 'starting'}
          className="mt-6 w-full rounded-xl bg-[var(--ink)] py-3 text-lg font-medium text-[var(--paper)] disabled:opacity-50">
          {phase === 'starting' ? 'Hazırlanıyor…' : 'Başla'}
        </button>
        <HowToModal />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-3 px-2 pt-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-[var(--ink-soft)]">
          #{puzzleNumber} · {LABELS[puzzle.difficulty]}
        </span>
        <div className="flex items-center gap-3">
          {session && (
            <Timer startedAt={session.startedAt} serverNow={session.serverNow}
              penaltyMs={penaltyMs} finalMs={result?.durationMs ?? null} />
          )}
          <button type="button" onClick={hint} aria-label="İpucu al (+15 sn)"
            className="flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-sm">
            <Lightbulb className="h-4 w-4" />+15sn
          </button>
        </div>
      </div>
      {error && <p className="px-2 text-sm text-[var(--accent)]">{error}</p>}
      <Grid puzzle={puzzle} letters={state.letters} sel={state.sel}
        activeCells={activeCells} correctCells={correctCells}
        onCellTap={(row, col) => dispatch({ type: 'SELECT', row, col })} />
      {entry && (
        <ClueBar entry={entry}
          onPrev={() => dispatch({ type: 'NEXT_ENTRY', delta: -1 })}
          onNext={() => dispatch({ type: 'NEXT_ENTRY', delta: 1 })}
          onToggleDir={() => dispatch({ type: 'SELECT', row: state.sel.row, col: state.sel.col })} />
      )}
      <div className="mt-auto">
        <Keyboard onLetter={(l) => dispatch({ type: 'TYPE', letter: l })}
          onDelete={() => dispatch({ type: 'DELETE' })} />
      </div>
      <FinishDialog open={phase === 'done'} durationMs={result?.durationMs ?? 0}
        rank={result?.rank ?? null} isRanked={result?.isRanked ?? false} isGuest={isGuest}
        hintCount={hintCount} puzzleNumber={puzzleNumber} difficulty={puzzle.difficulty}
        date={puzzle.date} />
    </div>
  );
}
