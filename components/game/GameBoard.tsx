'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eraser, Lightbulb } from 'lucide-react';
import { activeEntry, allCellsFilled, cellsOf, entryString, useGameState } from '@/hooks/useGameState';
import { LetterTile } from '@/components/ui/LetterTile';
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABELS } from '@/lib/difficulty';
import { wordHash } from '@/lib/hash';
import { trUpper } from '@/lib/tr';
import { formatTrtDate } from '@/lib/date';
import { type ClientPuzzle, type Letters, hashKey } from '@/lib/types';
import { ClueBar } from './ClueBar';
import { FinishDialog } from './FinishDialog';
import { Grid } from './Grid';
import { HowToModal } from './HowToModal';
import { Timer } from './Timer';

type SessionInfo = {
  sessionId: number; startedAt: string; serverNow: string; existing: boolean;
  status: 'active' | 'completed'; hintCount: number; penaltyMs: number;
  durationMs: number | null; isRanked: boolean;
};
type Phase = 'idle' | 'starting' | 'playing' | 'submitting' | 'done' | 'revisit';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`istek başarısız: ${url} ${res.status}`);
  return (await res.json()) as T;
}

export function GameBoard({ puzzle, puzzleNumber, isArchive, alreadyCompleted }: {
  puzzle: ClientPuzzle; puzzleNumber: number; isArchive: boolean; alreadyCompleted: boolean;
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
  const [hintCells, setHintCells] = useState<Set<string>>(new Set()); // ipucuyla açılan hücreler
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const submitting = useRef(false);

  const storageKey = session ? `harfiyen:letters:${session.sessionId}` : null;
  const hintsKey = session ? `harfiyen:hints:${session.sessionId}` : null;

  const start = useCallback(async () => {
    setPhase('starting');
    setError(null);
    try {
      const s = await post<SessionInfo>('/api/session/start', { puzzleId: puzzle.id, replay: isArchive });
      setSession(s);
      setPenaltyMs(s.penaltyMs);
      setHintCount(s.hintCount);
      if (s.status === 'completed') {
        // Daha önce bitirilmiş bir bölüme dönüldüğünde grid HİÇBİR ZAMAN
        // render edilmez (aşağıdaki 'revisit' dalı) — cevapların ekran
        // görüntüsüyle başkasına sızması engellenir. Sırayı/puanı yine de
        // göstermek için submit'i idempotent olarak tekrar çağırıyoruz:
        // tamamlanmış bir oturumda letters hiç karşılaştırılmadan önbellekten
        // rank döner (bkz. lib/game/session.ts finishSession).
        try {
          const r = await post<
            { correct: false } | { correct: true; durationMs: number; rank: number | null; isRanked: boolean }
          >('/api/session/submit', { sessionId: s.sessionId, letters: state.letters });
          if (r.correct) setResult({ durationMs: r.durationMs, rank: r.rank, isRanked: r.isRanked });
          else setResult({ durationMs: s.durationMs ?? 0, rank: null, isRanked: s.isRanked });
        } catch {
          setResult({ durationMs: s.durationMs ?? 0, rank: null, isRanked: s.isRanked });
        }
        setPhase('revisit');
        return;
      }
      const saved = localStorage.getItem(`harfiyen:letters:${s.sessionId}`);
      if (saved) dispatch({ type: 'SET_LETTERS', letters: JSON.parse(saved) as Letters });
      const savedHints = localStorage.getItem(`harfiyen:hints:${s.sessionId}`);
      if (savedHints) setHintCells(new Set(JSON.parse(savedHints) as string[]));
      setPhase('playing');
    } catch {
      setError('Bağlantı kurulamadı. Tekrar dene.');
      setPhase('idle');
    }
  }, [puzzle.id, isArchive, dispatch, state.letters]);

  // Bitirilmiş bulmacada "Başla" beklenmez — açılışta sonuç doğrudan yüklenir.
  // error guard'ı, başarısız denemede sonsuz döngüyü keser (Tekrar Dene butonu
  // start'ı elle çağırır ve error'u sıfırlar).
  useEffect(() => {
    if (alreadyCompleted && phase === 'idle' && !error) void start();
  }, [alreadyCompleted, phase, error, start]);

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
            if (hintsKey) localStorage.removeItem(hintsKey);
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
  }, [correctKeys, phase, session, state.letters, ctx, puzzle.entries.length, storageKey, hintsKey]);

  const entry = phase === 'playing' ? activeEntry(ctx, state.sel) : null;
  const activeCells = new Set(entry ? cellsOf(entry).map((c) => `${c.row}:${c.col}`) : []);
  const correctCells = new Set<string>();
  for (const e of puzzle.entries) {
    if (correctKeys.has(hashKey(e.no, e.dir))) {
      for (const c of cellsOf(e)) correctCells.add(`${c.row}:${c.col}`);
    }
  }
  // Kilitli hücreler = doğrulanmış (yeşil) ∪ ipucuyla açılmış; TYPE/DELETE/
  // CLEAR_* hiçbirine dokunamaz. Fiziksel klavye dinleyicisi her render'da
  // yeniden bağlanmasın diye ref üzerinden okur.
  const lockedCells = new Set([...correctCells, ...hintCells]);
  const lockedRef = useRef(lockedCells);
  lockedRef.current = lockedCells;

  // Mobilde ekran klavyesi yerine kullanıcının KENDİ klavyesi: grid'in içine
  // gömülü, görünmez bir input odak tutar; hücreye dokununca odaklanır ve
  // işletim sisteminin klavyesi açılır. Girdi, sentinel (tek boşluk) diff'iyle
  // okunur — beforeinput/keydown farklılıklarından (iOS/GBoard/IME) etkilenmez:
  //   değer boşaldıysa → backspace; boşluk dışı karakter geldiyse → harf(ler).
  const inputRef = useRef<HTMLInputElement | null>(null);
  const SENTINEL = ' ';
  const resetNativeInput = (el: HTMLInputElement): void => {
    el.value = SENTINEL;
    el.setSelectionRange(SENTINEL.length, SENTINEL.length);
  };
  const onNativeInput = (e: React.FormEvent<HTMLInputElement>): void => {
    const el = e.currentTarget;
    const v = el.value;
    if (v.length === 0) {
      dispatch({ type: 'DELETE', protectedCells: lockedRef.current });
    } else {
      for (const ch of v) {
        if (ch === SENTINEL) continue;
        dispatch({ type: 'TYPE', letter: trUpper(ch), protectedCells: lockedRef.current });
      }
    }
    resetNativeInput(el);
  };

  // Oyun başlayınca klavye açılsın; bitince kapanabilsin.
  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus();
    if (phase === 'done') inputRef.current?.blur();
  }, [phase]);

  const hint = useCallback(async () => {
    if (!session || phase !== 'playing' || hintBusy) return;
    // Seçili hücre zaten yeşilse (doğrulanmış), ipucu boşa gitmesin — kelimenin
    // sıradaki boş hücresine geç. Eskiden bu durumda buton sessizce hiçbir şey
    // yapmıyordu ("basınca hemen olmuyor" şikâyeti tam da buydu); artık ya
    // anlamlı bir hücreyi açar ya da neden yapamadığını söyler.
    let target = state.sel;
    const filled = state.letters[target.row][target.col] !== null;
    if (filled && lockedCells.has(`${target.row}:${target.col}`)) {
      const active = activeEntry(ctx, state.sel);
      const nextEmpty = cellsOf(active).find((c) => state.letters[c.row][c.col] === null);
      if (!nextEmpty) { setError('Bu kelime zaten tamamlandı.'); return; }
      target = { ...state.sel, row: nextEmpty.row, col: nextEmpty.col };
    }
    setHintBusy(true);
    setError(null);
    try {
      const r = await post<{ letter: string; hintCount: number; penaltyMs: number }>(
        '/api/session/hint',
        { sessionId: session.sessionId, row: target.row, col: target.col },
      );
      setPenaltyMs(r.penaltyMs);
      setHintCount(r.hintCount);
      const key = `${target.row}:${target.col}`;
      // İpuçlu hücre kalıcı olarak kilitlenir + görsel işaretlenir; sayfa
      // yenilense de kaybolmasın diye oturum bazında localStorage'a yazılır.
      const nextHints = new Set(hintCells);
      nextHints.add(key);
      setHintCells(nextHints);
      if (hintsKey) localStorage.setItem(hintsKey, JSON.stringify([...nextHints]));
      dispatch({ type: 'REVEAL', row: target.row, col: target.col, letter: r.letter });
      if (target.row !== state.sel.row || target.col !== state.sel.col) {
        dispatch({ type: 'SELECT', row: target.row, col: target.col });
      }
      setFlashCell(key);
      setTimeout(() => setFlashCell((current) => (current === key ? null : current)), 500);
    } catch {
      setError('İpucu alınamadı. Tekrar dene.');
    } finally {
      setHintBusy(false);
    }
  }, [session, phase, hintBusy, state.sel, state.letters, lockedCells, hintCells, hintsKey, ctx, dispatch]);

  const clearWord = useCallback(() => {
    dispatch({ type: 'CLEAR_WORD', protectedCells: lockedCells });
  }, [dispatch, lockedCells]);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL', protectedCells: lockedCells });
  }, [dispatch, lockedCells]);

  // fiziksel klavye
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        dispatch({ type: 'DELETE', protectedCells: lockedRef.current });
        return;
      }
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
      if (e.key.length === 1) {
        // preventDefault şart: odak gizli input'tayken karakter input'a da
        // düşer ve onNativeInput ikinci bir TYPE üretirdi (çift harf).
        // Mobil IME'ler keydown'u 'Unidentified' gönderir → bu dala girmez,
        // harf yalnızca onNativeInput yolundan işlenir; çakışma olmaz.
        e.preventDefault();
        dispatch({ type: 'TYPE', letter: trUpper(e.key), protectedCells: lockedRef.current });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, dispatch, state.sel]);

  if (phase === 'idle' || phase === 'starting') {
    if (alreadyCompleted) {
      // Bitirilmiş bulmacada "Başla" kartı kafa karıştırır (başlayacak bir şey
      // yok) — sonuç yüklenirken sade bir bekleme durumu gösterilir; start()
      // aşağıdaki efektle otomatik tetiklenir ve 'revisit' ekranına düşer.
      return (
        <div className="mx-auto max-w-sm px-4 py-24 text-center">
          <p className="text-sm text-[var(--ink-soft)]">Sonucun yükleniyor…</p>
          {error && (
            <>
              <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>
              <button type="button" onClick={start}
                className="mt-4 rounded-xl border border-[var(--line)] px-5 py-2 text-sm font-medium">
                Tekrar Dene
              </button>
            </>
          )}
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <div className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper-raised)] p-6 text-center shadow-[0_28px_70px_-45px_var(--diff-hard)] sm:p-8">
          <div className="flex justify-center"><LetterTile difficulty={puzzle.difficulty} /></div>
          <p className="mt-4 bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text font-display text-4xl text-transparent">
            Harfiyen #{puzzleNumber}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{formatTrtDate(puzzle.date)}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold">
            <span className={`rounded-full px-3 py-1 ${DIFFICULTY_BADGE_CLASS[puzzle.difficulty]}`}>
              {DIFFICULTY_LABELS[puzzle.difficulty]}
            </span>
            <span className="rounded-full bg-[var(--paper)] px-3 py-1 text-[var(--ink-soft)]">
              {puzzle.size}×{puzzle.size}
            </span>
            <span className="rounded-full bg-[var(--paper)] px-3 py-1 text-[var(--ink-soft)]">
              {puzzle.entries.length} kelime
            </span>
          </div>
          {isArchive && <p className="mt-4 text-sm text-[var(--ink-soft)]">Arşiv oyunu — sıralamaya girmez.</p>}
          <p className="mt-4 text-sm text-[var(--ink-soft)]">Süre "Başla" dediğin an işlemeye başlar.</p>
          {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}
          <button type="button" onClick={start} disabled={phase === 'starting'}
            className="mt-6 w-full rounded-2xl bg-[var(--ink)] py-3.5 text-lg font-semibold text-[var(--paper)] shadow-lg transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:opacity-50">
            {phase === 'starting' ? 'Hazırlanıyor…' : 'Başla'}
          </button>
        </div>
        <HowToModal />
      </div>
    );
  }

  if (phase === 'revisit') {
    // Grid/ClueBar BİLEREK hiç render edilmiyor — daha önce çözülmüş
    // bir bölüme dönüldüğünde cevapların ekran görüntüsüyle sızması engellenir.
    // FinishDialog kendi başına tam ekran (fixed inset-0) bir katman olduğundan
    // sarmalayıcı bir kapsayıcıya gerek yok. Sıra/puan/ipucu sayısı yine de
    // gösterilir (start()'taki idempotent submit çağrısından gelir).
    return (
      <FinishDialog open durationMs={result?.durationMs ?? 0} rank={result?.rank ?? null}
        isRanked={result?.isRanked ?? false} hintCount={hintCount} puzzleNumber={puzzleNumber}
        difficulty={puzzle.difficulty} date={puzzle.date} />
    );
  }

  return (
    // Sabit dvh + mt-auto YOK: klavye içeriğin doğal akışında, ipucu çubuğunun
    // hemen altında durur. Önceki sürümde min-h-[100dvh] + mt-auto, geniş/uzun
    // masaüstü pencerelerinde klavyeyi ekranın en altına itip görünmez kılıyordu.
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-2.5 py-3 sm:gap-4 sm:px-4 sm:py-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          {/* Mini taş zorluğu tek başına anlatır — ayrıca rozetle yer kaplamayız */}
          <LetterTile difficulty={puzzle.difficulty} size="sm" />
          <span className="font-display text-lg font-semibold text-[var(--ink)]">
            #{puzzleNumber}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {session && (
            <span className="rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-1.5">
              <Timer startedAt={session.startedAt} serverNow={session.serverNow}
                penaltyMs={penaltyMs} finalMs={result?.durationMs ?? null} />
            </span>
          )}
          <button type="button" onClick={clearAll} onPointerDown={(e) => e.preventDefault()}
            aria-label="Tümünü temizle (doğrular korunur)" title="Tümünü temizle"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-raised)]">
            <Eraser className="h-4 w-4" />
          </button>
          <button type="button" onClick={hint} disabled={hintBusy}
            onPointerDown={(e) => e.preventDefault()} aria-label="İpucu al (+15 sn)"
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 text-sm font-medium text-[var(--ink)] transition-all active:scale-95 disabled:opacity-60">
            <Lightbulb className={`h-4 w-4 text-[var(--accent)] ${hintBusy ? 'animate-pulse' : ''}`} />
            {hintBusy ? '…' : '+15sn'}
          </button>
        </div>
      </div>
      {error && <p className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">{error}</p>}
      <div className="relative">
        {/* Görünmez odak hedefi: mobilde native klavyeyi açar. Grid'in üst
            hizasına gömülü (ekran dışına konursa iOS odaklanınca sayfayı
            oraya kaydırır); 16px font iOS'in odakta zoom yapmasını önler. */}
        <input ref={inputRef} type="text" defaultValue={SENTINEL}
          className="absolute left-1/2 top-0 h-px w-px -translate-x-1/2 opacity-0"
          style={{ fontSize: 16, caretColor: 'transparent' }}
          autoCapitalize="characters" autoCorrect="off" autoComplete="off"
          spellCheck={false} enterKeyHint="next" aria-hidden tabIndex={-1}
          onInput={onNativeInput}
          onSelect={(e) => {
            const el = e.currentTarget;
            // imleç her zaman sentinel'in ARKASINDA durmalı ki backspace
            // deleteContentBackward üretebilsin (imleç 0'dayken üretmez)
            if (el.selectionStart !== el.value.length) resetNativeInput(el);
          }} />
        <Grid puzzle={puzzle} letters={state.letters} sel={state.sel}
          activeCells={activeCells} correctCells={correctCells} hintCells={hintCells}
          flashCell={flashCell}
          onCellTap={(row, col) => {
            dispatch({ type: 'SELECT', row, col });
            inputRef.current?.focus();
          }} />
      </div>
      {entry && (
        <ClueBar entry={entry} onClearWord={clearWord}
          onPrev={() => dispatch({ type: 'NEXT_ENTRY', delta: -1 })}
          onNext={() => dispatch({ type: 'NEXT_ENTRY', delta: 1 })}
          onToggleDir={() => dispatch({ type: 'SELECT', row: state.sel.row, col: state.sel.col })} />
      )}
      <FinishDialog open={phase === 'done'} durationMs={result?.durationMs ?? 0}
        rank={result?.rank ?? null} isRanked={result?.isRanked ?? false}
        hintCount={hintCount} puzzleNumber={puzzleNumber} difficulty={puzzle.difficulty}
        date={puzzle.date} />
    </div>
  );
}
