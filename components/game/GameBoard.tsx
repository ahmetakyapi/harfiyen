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

  // Otomatik "sonraki soru" YALNIZCA aktif kelime DOĞRU tamamlanınca olur.
  // advance() artık kelimeyi tamamlayınca başka soruya atlamıyor (yanlışsa
  // kullanıcı düzeltebilsin diye kelimede kalır); doğruluk hash ile burada,
  // asenkron bilindiğinden geçişi bu efekt yapar. prevCorrectRef her çalışmada
  // güncellenir: kelime YENİ doğru olduğunda geçilir, kullanıcı sonradan
  // doğru bir kelimeye elle dönerse istenmeyen "sıçrama" olmaz.
  const prevCorrectRef = useRef(correctKeys);
  useEffect(() => {
    const prev = prevCorrectRef.current;
    prevCorrectRef.current = correctKeys;
    if (phase !== 'playing') return;
    const active = activeEntry(ctx, state.sel);
    const key = hashKey(active.no, active.dir);
    if (correctKeys.has(key) && !prev.has(key)) {
      dispatch({ type: 'NEXT_INCOMPLETE' });
    }
  }, [correctKeys, phase, ctx, state.sel, dispatch]);

  // MOBİL KLAVYE MİMARİSİ — kullanıcının KENDİ klavyesi (ekran klavyesi yok):
  // Grid'in tamamını kaplayan, görünmez ama TIKLANABİLİR bir input var. Mobil
  // tarayıcılarda klavye YALNIZCA bir input'a doğrudan dokununca açılır
  // (başka öğeye dokunup programatik focus() güvenilir değildir — eski hata
  // buydu). Bu yüzden dokunma doğrudan input'a gider, dokunulan hücreyi
  // koordinattan hesaplarız. Yazılan girdi sentinel-diff ile okunur; iOS/
  // Android/GBoard/IME farklarından bağımsızdır: değer boşaldıysa backspace,
  // sentinel dışı her karakter bir harf.
  const inputRef = useRef<HTMLInputElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const SENTINEL = ' ';
  const resetNativeInput = (): void => {
    const el = inputRef.current;
    if (!el) return;
    el.value = SENTINEL;
    try { el.setSelectionRange(SENTINEL.length, SENTINEL.length); } catch { /* focus yoksa yok say */ }
  };
  const onNativeInput = (e: React.FormEvent<HTMLInputElement>): void => {
    const v = e.currentTarget.value;
    if (v.length === 0) {
      dispatch({ type: 'DELETE', protectedCells: lockedRef.current });
    } else {
      for (const ch of v) {
        if (ch === SENTINEL) continue;
        dispatch({ type: 'TYPE', letter: trUpper(ch), protectedCells: lockedRef.current });
      }
    }
    resetNativeInput();
  };

  // Dokunulan pikselden hücreyi bul → SELECT. Grid: p-[3px] + gap-[2px], kareler.
  // Dokunma doğrudan input'ta olduğundan mobilde klavye ilk dokunuşta açılır.
  const onGridPointer = (e: React.PointerEvent<HTMLInputElement>): void => {
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const pad = 3, gap = 2;
    const step = (rect.width - 2 * pad - (puzzle.size - 1) * gap) / puzzle.size + gap;
    const clamp = (n: number): number => Math.min(puzzle.size - 1, Math.max(0, n));
    const col = clamp(Math.floor((e.clientX - rect.left - pad) / step));
    const row = clamp(Math.floor((e.clientY - rect.top - pad) / step));
    dispatch({ type: 'SELECT', row, col });
    // Dokunma doğrudan input'ta olsa da odağı AÇIKÇA garantiye al: iOS'te
    // odak kullanıcı jesti içinde çağrılınca klavye (yeniden) açılır — bu,
    // klavye kapatıldıktan sonra tekrar dokununca kesin açılmasını sağlar.
    inputRef.current?.focus();
    // imleci sentinel'in arkasına al ki ilk backspace deleteContentBackward
    // üretebilsin (odak yeni oturuyor olabilir → bir sonraki kareye ertele).
    requestAnimationFrame(resetNativeInput);
  };

  // Oyun başlayınca odak input'a (masaüstünde de yazım çalışsın); bitince bırak.
  useEffect(() => {
    if (phase === 'playing') { inputRef.current?.focus(); resetNativeInput(); }
    if (phase === 'done' || phase === 'submitting') inputRef.current?.blur();
  }, [phase]);

  // Seçili hücre native klavyenin altında kalırsa görünür alana kaydır —
  // büyük grid + açık klavye kombinasyonunda alt satırlara erişimi sağlar.
  useEffect(() => {
    if (phase !== 'playing') return;
    const grid = gridRef.current;
    const vv = window.visualViewport;
    if (!grid || !vv) return;
    const rect = grid.getBoundingClientRect();
    const pad = 3, gap = 2;
    const cw = (rect.width - 2 * pad - (puzzle.size - 1) * gap) / puzzle.size;
    const cellTop = rect.top + pad + state.sel.row * (cw + gap);
    const cellBottom = cellTop + cw;
    const margin = 16;
    const visTop = vv.offsetTop;
    const visBottom = vv.offsetTop + vv.height;
    if (cellBottom > visBottom - margin) {
      window.scrollBy({ top: cellBottom - (visBottom - margin), behavior: 'smooth' });
    } else if (cellTop < visTop + margin) {
      window.scrollBy({ top: cellTop - (visTop + margin), behavior: 'smooth' });
    }
  }, [state.sel, phase, puzzle.size]);

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

  // Fiziksel klavye: harf ve backspace input'un onInput yolundan işlenir
  // (masaüstünde de input odaktadır) — burada YALNIZCA gezinme tuşları var,
  // böylece çift işleme (hem keydown hem onInput) olmaz. Ok/boşluk/Tab'ın
  // input içindeki varsayılan davranışını (imleç oynatma, odak değiştirme)
  // engellemek için preventDefault şart.
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        dispatch({ type: 'NEXT_ENTRY', delta: e.shiftKey ? -1 : 1 });
      } else if (e.key === ' ') {
        e.preventDefault();
        dispatch({ type: 'SELECT', row: state.sel.row, col: state.sel.col });
      } else if (e.key === 'ArrowUp') { e.preventDefault(); dispatch({ type: 'MOVE', dRow: -1, dCol: 0 }); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); dispatch({ type: 'MOVE', dRow: 1, dCol: 0 }); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); dispatch({ type: 'MOVE', dRow: 0, dCol: -1 }); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); dispatch({ type: 'MOVE', dRow: 0, dCol: 1 }); }
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
      {/* İpucu şeridi grid'in ÜSTÜNDE ve header'ın altında yapışkan: native
          klavye ekranın altını kaplasa bile hangi kelimede olduğun her zaman
          görünür kalır (klavyenin gizlediği şikayeti tam da buydu). */}
      {entry && (
        <div className="sticky top-14 z-30 -mx-2.5 bg-[var(--paper)] px-2.5 pb-1 pt-1 sm:-mx-4 sm:px-4">
          <ClueBar entry={entry} onClearWord={clearWord}
            onPrev={() => dispatch({ type: 'NEXT_ENTRY', delta: -1 })}
            onNext={() => dispatch({ type: 'NEXT_ENTRY', delta: 1 })}
            onToggleDir={() => dispatch({ type: 'SELECT', row: state.sel.row, col: state.sel.col })} />
        </div>
      )}
      <div ref={gridRef} className="relative mx-auto w-full max-w-[28rem]">
        <Grid puzzle={puzzle} letters={state.letters} sel={state.sel}
          activeCells={activeCells} correctCells={correctCells} hintCells={hintCells}
          flashCell={flashCell} />
        {/* Grid'i tam kaplayan görünmez, tıklanabilir input: doğrudan dokunma
            = ilk dokunuşta native klavye. 16px font iOS odak-zoom'unu önler;
            imleç ve metin görünmez. */}
        <input ref={inputRef} type="text" inputMode="text" defaultValue={SENTINEL}
          aria-label="Bulmaca — harf gir"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-2xl bg-transparent text-transparent outline-none"
          style={{ fontSize: 16, caretColor: 'transparent' }}
          autoCapitalize="off" autoCorrect="off" autoComplete="off"
          spellCheck={false} enterKeyHint="next"
          onInput={onNativeInput}
          onPointerDown={onGridPointer}
          onFocus={resetNativeInput} />
      </div>
      <FinishDialog open={phase === 'done'} durationMs={result?.durationMs ?? 0}
        rank={result?.rank ?? null} isRanked={result?.isRanked ?? false}
        hintCount={hintCount} puzzleNumber={puzzleNumber} difficulty={puzzle.difficulty}
        date={puzzle.date} />
    </div>
  );
}
