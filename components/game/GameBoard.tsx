'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Lightbulb, List, Trash2, X } from 'lucide-react';
import { activeEntry, allCellsFilled, cellsOf, entryString, useGameState } from '@/hooks/useGameState';
import { usePlayViewport } from '@/hooks/usePlayHeight';
import { LetterTile } from '@/components/ui/LetterTile';
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABELS } from '@/lib/difficulty';
import { hapticSolve, hapticWrong } from '@/lib/haptics';
import { wordHash } from '@/lib/hash';
import { isTrLetter, trUpper } from '@/lib/tr';
import { formatTrtDate } from '@/lib/date';
import { type ClientPuzzle, type Direction, type Letters, hashKey } from '@/lib/types';
import { ClueBar } from './ClueBar';
import { ClueList } from './ClueList';
import { FinishDialog } from './FinishDialog';
import { GRID_GAP, GRID_PAD, Grid, cellSizeOf } from './Grid';
import { HowToModal } from './HowToModal';
import { Timer } from './Timer';

type SessionInfo = {
  sessionId: number; startedAt: string; serverNow: string; existing: boolean;
  status: 'active' | 'completed'; hintCount: number; penaltyMs: number;
  durationMs: number | null; isRanked: boolean;
};
type SubmitResult =
  | { correct: false }
  | {
      correct: true; durationMs: number; rank: number | null; isRanked: boolean;
      streak?: { current: number; best: number } | null;
    };
type Phase = 'idle' | 'starting' | 'playing' | 'submitting' | 'done' | 'revisit';

// Grid sonsuz büyümesin diye bir üst sınır. Gerçek boyutu neredeyse her zaman
// ölçülen kutu belirler; bu sınır yalnızca çok büyük monitörlerde devreye
// girer (bundan sonrası göz gezdirme mesafesini artırmaktan başka işe yaramaz).
const MAX_GRID_PX = 760;

// Yanlış tamamlanan kelime bu süre boyunca kırmızı yanıp sarsıldıktan SONRA
// temizlenir. Anında silmek "harflerim sebepsiz kayboldu" hissi veriyor; daha
// uzun tutmak ise düzeltmeye başlamak isteyen oyuncuyu bekletiyor.
const WRONG_CLEAR_MS = 620;

// Gizli girdi alanı ASLA boşalmaz: boş bir alanda bazı mobil klavyeler
// backspace için hiçbir olay üretmez ("silinecek şey yok" sayarlar). Sabit bir
// dolgu bunu garantiye alır. Dolgu görünmez (alan zaten saydam) ve harf
// olmadığı için gerçek girdiden her zaman ayırt edilebilir.
const PAD_CHAR = ' ';
const INPUT_PAD = PAD_CHAR.repeat(16);

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
  const [result, setResult] = useState<{
    durationMs: number; rank: number | null; isRanked: boolean;
    streak?: { current: number; best: number } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [correctKeys, setCorrectKeys] = useState<Set<string>>(new Set());
  const [hintCells, setHintCells] = useState<Set<string>>(new Set()); // ipucuyla açılan hücreler
  const [flashCell, setFlashCell] = useState<string | null>(null);
  // Yanlış tamamlanmış, temizlenmeyi bekleyen kelime (bkz. WRONG_CLEAR_MS).
  const [wrongEntry, setWrongEntry] = useState<{ no: number; dir: Direction } | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [listOpen, setListOpen] = useState(false); // mobil ipucu listesi paneli
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
          const r = await post<SubmitResult>('/api/session/submit', {
            sessionId: s.sessionId, letters: state.letters,
          });
          if (r.correct) {
            setResult({ durationMs: r.durationMs, rank: r.rank, isRanked: r.isRanked, streak: r.streak });
          } else {
            setResult({ durationMs: s.durationMs ?? 0, rank: null, isRanked: s.isRanked });
          }
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

  // Hata mesajları kendiliğinden kaybolur: eskiden bir sonraki eyleme kadar
  // ekranda kalıyor, dar ekranda yer kaplıyordu.
  useEffect(() => {
    if (error === null) return;
    const id = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(id);
  }, [error]);

  // Seçim, hash efektinin İÇİNDEN okunur ama onun bağımlılığı DEĞİLDİR: sırf
  // imleç kaydı diye bütün kelimeleri yeniden hash'lemek gereksiz iş olurdu.
  const selRef = useRef(state.sel);
  selRef.current = state.sel;
  // Bir önceki değerlendirmede TAMAMEN dolu olan kelimeler. Otomatik temizlik
  // yalnızca YENİ dolan bir kelime için çalışsın diye tutulur.
  const filledKeysRef = useRef<Set<string>>(new Set());
  // İlk değerlendirme (kayıtlı oyunun localStorage'dan yüklenmesi) temizlik
  // tetiklemez — oyuncu daha hiçbir şey yazmadan harfleri silinmesin.
  const autoClearPrimedRef = useRef(false);

  // harfler değiştikçe kaydet + doğru kelimeleri hash ile işaretle
  useEffect(() => {
    if (phase !== 'playing' || !storageKey || !session) return;
    localStorage.setItem(storageKey, JSON.stringify(state.letters));
    let cancelled = false;
    void (async () => {
      const next = new Set<string>();
      const filled = new Set<string>();
      for (const e of puzzle.entries) {
        const word = entryString(state.letters, e);
        if (word === null) continue;
        const key = hashKey(e.no, e.dir);
        filled.add(key);
        const h = await wordHash(puzzle.publicId, e.no, e.dir, word);
        if (h === puzzle.wordHashes[key]) next.add(key);
      }
      if (cancelled) return;
      setCorrectKeys(next);

      // ——— Yanlış tamamlanan kelimeyi işaretle ———
      // Doğruluk yalnızca burada, hash karşılaştırmasıyla ve asenkron bilinir;
      // bu yüzden karar da burada verilir. Tetikleme YALNIZCA aktif kelime için:
      // kesişen bir kelime tesadüfen yanlış tamamlandıysa oyuncunun üzerinde
      // çalışmadığı harfleri silmek şaşırtıcı olurdu.
      const wasFilled = filledKeysRef.current;
      filledKeysRef.current = filled;
      if (!autoClearPrimedRef.current) { autoClearPrimedRef.current = true; return; }
      const active = activeEntry(ctx, selRef.current);
      const key = hashKey(active.no, active.dir);
      if (filled.has(key) && !wasFilled.has(key) && !next.has(key)) {
        setWrongEntry({ no: active.no, dir: active.dir });
      }
    })();
    return () => { cancelled = true; };
  }, [state.letters, phase, storageKey, session, puzzle, ctx]);

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
          const r = await post<SubmitResult>('/api/session/submit', {
            sessionId: session.sessionId, letters: state.letters,
          });
          if (r.correct) {
            setResult({ durationMs: r.durationMs, rank: r.rank, isRanked: r.isRanked, streak: r.streak });
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

  const inGame = phase === 'playing' || phase === 'submitting';
  const entry = inGame ? activeEntry(ctx, state.sel) : null;
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

  // Temizlenecek hücreler = yanlış kelimenin KİLİTLİ OLMAYAN hücreleri. İpucuyla
  // açılan harfler ve kesişen doğru kelimeden gelen harfler bu kümede yoktur —
  // ne kırmızı yanar ne de silinir. Oyuncu kazandığı hiçbir bilgiyi kaybetmez.
  const wrongCells = new Set<string>();
  if (wrongEntry) {
    const e = puzzle.entries.find((x) => x.no === wrongEntry.no && x.dir === wrongEntry.dir);
    for (const c of e ? cellsOf(e) : []) {
      const key = `${c.row}:${c.col}`;
      if (!lockedCells.has(key)) wrongCells.add(key);
    }
  }

  // Yanlış tamamlanan kelime kısa bir uyarıdan sonra kendi kendine temizlenir.
  // Harf harf geri silmeye çalışmak — özellikle mobilde — oyunun en zorlandığı
  // hareketiydi; yanlış bir kelimeyi baştan yazmak neredeyse her zaman tek tek
  // düzeltmekten hızlıdır.
  useEffect(() => {
    if (!wrongEntry) return;
    hapticWrong();
    const id = setTimeout(() => {
      dispatch({
        type: 'CLEAR_ENTRY', no: wrongEntry.no, dir: wrongEntry.dir,
        protectedCells: lockedRef.current,
      });
      setWrongEntry(null);
    }, WRONG_CLEAR_MS);
    return () => clearTimeout(id);
  }, [wrongEntry, dispatch]);

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
    if (correctKeys.size > prev.size) hapticSolve();
    const active = activeEntry(ctx, state.sel);
    const key = hashKey(active.no, active.dir);
    if (correctKeys.has(key) && !prev.has(key)) {
      dispatch({ type: 'NEXT_INCOMPLETE' });
    }
  }, [correctKeys, phase, ctx, state.sel, dispatch]);

  // ——— GİRDİ ———
  // Girdi kullanıcının KENDİ (native) klavyesinden gelir. Bunun bedeli,
  // telefonu Türkçe olmayan oyuncunun Ç/Ğ/İ/Ö/Ş/Ü için uzun basmak zorunda
  // kalması; karşılığında oyuncu alıştığı klavyeyi kullanır. Yerleşim tarafı
  // buna göre kurulmuştur: yüzey görünür viewport'a sabitlenir ve ipucu şeridi
  // klavyenin üstünde kalır (bkz. usePlayViewport).
  const typeLetter = useCallback((letter: string) => {
    dispatch({ type: 'TYPE', letter, protectedCells: lockedRef.current });
  }, [dispatch]);
  const deleteLetter = useCallback(() => {
    dispatch({ type: 'DELETE', protectedCells: lockedRef.current });
  }, [dispatch]);
  const pushText = useCallback((text: string) => {
    for (const ch of text) {
      const letter = trUpper(ch);
      if (isTrLetter(letter)) typeLetter(letter);
    }
  }, [typeLetter]);

  // Oyun alanının ölçülen kutusuna sığan en büyük kare. Grid ASLA taşmaz:
  // boyut viewport tahmininden değil, gerçek kutu ölçümünden gelir — her
  // telefonda, her yönelimde, tarayıcı çubuğu açık ya da kapalı çalışır.
  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridAreaRef = useRef<HTMLDivElement | null>(null);
  const [gridPx, setGridPx] = useState<number | null>(null);
  const { height: playHeight, offsetTop, keyboardOpen } = usePlayViewport();
  useEffect(() => {
    const el = gridAreaRef.current;
    if (!inGame || !el) return;
    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      const px = Math.floor(Math.min(rect.width, rect.height, MAX_GRID_PX));
      setGridPx((prev) => (prev !== null && Math.abs(prev - px) < 1 ? prev : Math.max(0, px)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [inGame, playHeight, keyboardOpen]);
  const cellPx = gridPx !== null && gridPx > 0 ? cellSizeOf(gridPx, puzzle.size) : null;

  // Sayfa kaydırmasını ve iOS lastik-bant etkisini oyun süresince kapat.
  useEffect(() => {
    if (!inGame) return;
    document.documentElement.classList.add('play-lock');
    return () => document.documentElement.classList.remove('play-lock');
  }, [inGame]);

  // ——— NATIVE KLAVYE ———
  // Girdi kullanıcının kendi klavyesinden gelir. Mobil tarayıcılarda klavye
  // YALNIZCA doğrudan bir input'a dokununca güvenilir açıldığından, grid'i tam
  // kaplayan görünmez bir input var; dokunulan hücre koordinattan hesaplanır.
  // Yazılan girdi sentinel farkıyla okunur: değer boşaldıysa backspace,
  // sentinel dışı her karakter bir harf. Bu yöntem iOS/Android/IME farklarından
  // bağımsızdır (keydown mobilde harf vermez).
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resetNativeInput = useCallback((): void => {
    const el = inputRef.current;
    if (!el) return;
    if (el.value !== INPUT_PAD) el.value = INPUT_PAD;
    try { el.setSelectionRange(INPUT_PAD.length, INPUT_PAD.length); } catch { /* odak yoksa yok say */ }
  }, []);

  // Girdinin ASIL yolu: beforeinput. `inputType` bize niyeti doğrudan söyler
  // (silme mi, harf mi) ve olayı iptal ederek alanın değerini HİÇ
  // değiştirmeyiz — böylece klavyenin/IME'nin iç durumu ile alanın gerçek
  // içeriği asla ayrışmaz. Eskiden her tuştan sonra değeri elle sıfırlıyorduk;
  // Android klavyeleri bu sıfırlamadan sonra art arda basılan backspace için
  // olay üretmeyi bırakabiliyordu — "silme çalışmıyor"un kök nedeni buydu.
  //
  // React'in sentetik onBeforeInput'ü inputType'ı her tarayıcıda taşımadığı
  // için dinleyici NATIVE bağlanır.
  useEffect(() => {
    const el = inputRef.current;
    if (!el || phase !== 'playing') return;
    const onBeforeInput = (ev: Event): void => {
      const e = ev as InputEvent;
      const type = e.inputType ?? '';
      if (type.startsWith('delete')) {
        e.preventDefault();
        deleteLetter();
        return;
      }
      if (type === 'insertText' || type === 'insertFromPaste' || type === 'insertReplacementText') {
        e.preventDefault();
        pushText(e.data ?? '');
        return;
      }
      // insertCompositionText İPTAL EDİLEMEZ (IME bileşimi sürüyor) — onInput
      // içindeki fark okuması devralır.
    };
    el.addEventListener('beforeinput', onBeforeInput);
    return () => el.removeEventListener('beforeinput', onBeforeInput);
  }, [phase, deleteLetter, pushText]);

  // Yedek yol: yalnızca beforeinput iptal EDİLEMEDİĞİNDE (bileşim yapan
  // klavyeler) buraya düşülür. Dolgu karakteri harf olamayacağı için gerçek
  // girdi konumdan bağımsız ayıklanabilir.
  const onNativeInput = (e: React.FormEvent<HTMLInputElement>): void => {
    const v = e.currentTarget.value;
    const typed = [...v].filter((ch) => ch !== PAD_CHAR).join('');
    if (typed.length > 0) pushText(typed);
    else if (v.length < INPUT_PAD.length) deleteLetter();
    resetNativeInput();
  };

  // Fiziksel klavyeler ve gerçek tuş kodu gönderen mobil klavyeler için.
  // preventDefault aynı tuş için beforeinput'un ateşlenmesini de engeller —
  // iki yol asla üst üste binmez, bir basışta iki harf silinmez.
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    e.preventDefault();
    deleteLetter();
  };

  // Dokunulan pikselden hücreyi bul. Ölçüler Grid'den içe aktarılan sabitlerle
  // ve ölçülen hücre kenarıyla hesaplanır — sayılar iki dosyada ayrışamaz.
  const onGridPointer = (e: React.PointerEvent<HTMLInputElement>): void => {
    const grid = gridRef.current;
    if (!grid || cellPx === null) return;
    const rect = grid.getBoundingClientRect();
    const step = cellPx + GRID_GAP;
    const clamp = (n: number): number => Math.min(puzzle.size - 1, Math.max(0, n));
    const col = clamp(Math.floor((e.clientX - rect.left - GRID_PAD) / step));
    const row = clamp(Math.floor((e.clientY - rect.top - GRID_PAD) / step));
    dispatch({ type: 'SELECT', row, col });
    // Odağı açıkça garantiye al: iOS'te kullanıcı jesti içinde focus() klavyeyi
    // (yeniden) açar — klavye kapatıldıktan sonra tekrar dokununca da açılır.
    inputRef.current?.focus();
    requestAnimationFrame(resetNativeInput);
  };

  // Oyun başlayınca odak input'a; bitince bırak (klavye kapansın).
  // gridPx bağımlılığı ŞART: grid ölçülene kadar sarmalayıcı
  // `visibility: hidden` ve görünmez bir öğe ODAK ALAMAZ — ilk denemede odak
  // sessizce başarısız oluyor, masaüstünde ilk harf kayboluyordu.
  useEffect(() => {
    if (phase === 'playing' && gridPx !== null) { inputRef.current?.focus(); resetNativeInput(); }
    if (phase === 'done' || phase === 'submitting') inputRef.current?.blur();
  }, [phase, gridPx, resetNativeInput]);

  const hint = useCallback(async () => {
    if (!session || phase !== 'playing' || hintBusy) return;
    // Seçili hücre zaten kilitliyse (doğru ya da önceden ipuçlu), ipucu boşa
    // gitmesin: aktif kelimede kilitli OLMAYAN ilk hücreye geç — bu, boş bir
    // hücre de olabilir yanlış doldurulmuş bir hücre de. Böylece ipucu her
    // zaman işe yarar; yalnızca kelimenin tamamı çözülmüşse uyarı verir.
    let target = state.sel;
    if (lockedCells.has(`${target.row}:${target.col}`)) {
      const active = activeEntry(ctx, state.sel);
      const open = cellsOf(active).find((c) => !lockedCells.has(`${c.row}:${c.col}`));
      if (!open) { setError('Bu kelime zaten çözüldü.'); return; }
      target = { ...state.sel, row: open.row, col: open.col };
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
  }, [session, phase, hintBusy, state.sel, lockedCells, hintCells, hintsKey, ctx, dispatch]);

  const clearWord = useCallback(() => {
    dispatch({ type: 'CLEAR_WORD', protectedCells: lockedCells });
  }, [dispatch, lockedCells]);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL', protectedCells: lockedCells });
  }, [dispatch, lockedCells]);

  // Fiziksel klavye (masaüstü). Odaklanmış bir metin alanı yok, bu yüzden tüm
  // tuşlar burada işlenir; harfler `tr-TR` büyütmeden geçer (i→İ, ı→I).
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { setListOpen(false); return; }
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
      // Harf ve Backspace BİLEREK burada yok: ikisi de input'un onInput
      // yolundan geçiyor (masaüstünde de odak input'ta). Burada da işlenirse
      // her tuş iki kez uygulanır.
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, dispatch, state.sel]);

  const pickEntry = useCallback((no: number, dir: 'across' | 'down') => {
    dispatch({ type: 'SELECT_ENTRY', no, dir });
    setListOpen(false);
  }, [dispatch]);

  if (phase === 'idle' || phase === 'starting') {
    if (alreadyCompleted) {
      // Bitirilmiş bulmacada "Başla" kartı kafa karıştırır (başlayacak bir şey
      // yok) — sonuç yüklenirken sade bir bekleme durumu gösterilir; start()
      // yukarıdaki efektle otomatik tetiklenir ve 'revisit' ekranına düşer.
      return (
        <div className="mx-auto max-w-sm px-4 py-24 text-center">
          <p className="text-sm text-[var(--ink-soft)]">Sonucun yükleniyor…</p>
          {error && (
            <>
              <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>
              <button type="button" onClick={start}
                className="mt-4 min-h-11 rounded-xl border border-[var(--line)] px-5 text-sm font-medium">
                Tekrar Dene
              </button>
            </>
          )}
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-sm px-4 pb-12">
        {/* Global başlık /play altında gizli (oyun tam ekran) — bu yüzden
            başlama kartının kendi geri bağlantısı var. */}
        <div className="flex h-14 items-center">
          <Link href="/" className="-ml-2 flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]">
            <ChevronLeft aria-hidden className="h-5 w-5" /> Harfiyen
          </Link>
        </div>
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
          <p className="mt-4 text-sm text-[var(--ink-soft)]">Süre &quot;Başla&quot; dediğin an işlemeye başlar.</p>
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
    return (
      <FinishDialog open durationMs={result?.durationMs ?? 0} rank={result?.rank ?? null}
        isRanked={result?.isRanked ?? false} streak={result?.streak ?? null}
        hintCount={hintCount} puzzleNumber={puzzleNumber}
        difficulty={puzzle.difficulty} date={puzzle.date} />
    );
  }

  const solvedCount = correctKeys.size;
  const totalCount = puzzle.entries.length;

  return (
    // Tek ekran, kaydırma yok. Yüzey GÖRÜNÜR viewport'a sabitlenir: native
    // klavye açılınca visualViewport küçülür, yüzey de küçülür ve grid yeniden
    // ölçülüp klavyenin üstüne sığar. `top: offsetTop` + sayfa kilidi, iOS'in
    // "odaklı alanı görünür yap" kaydırmasını etkisiz kılar — böylece ipucu
    // şeridi klavye açıkken de ekranın üstünde, okunur biçimde kalır.
    <div className="play-surface flex flex-col overflow-hidden"
      style={{
        position: 'fixed',
        top: offsetTop,
        left: 0,
        right: 0,
        height: playHeight !== null ? `${playHeight}px` : '100dvh',
        zIndex: 40,
        backgroundColor: 'var(--paper)',
        // Klavye açıkken çentik payı gereksiz (görünür alan zaten aşağıda başlar)
        paddingTop: keyboardOpen ? 0 : 'env(safe-area-inset-top)',
      }}>
      {/* Çözüm ilerlemesi: yatayda yer kaplamayan ince bir şerit. Sayı olarak
          da başlıkta var ama bu, göz ucuyla "ne kadar kaldı" hissini verir. */}
      <div className="h-[3px] shrink-0 bg-[var(--line)]" role="progressbar"
        aria-label="Çözülen kelime oranı" aria-valuemin={0} aria-valuemax={totalCount}
        aria-valuenow={solvedCount}>
        <div className="h-full bg-[var(--correct)] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${(solvedCount / totalCount) * 100}%` }} />
      </div>

      {/* Başlık şeridi 320 px'e kadar TAŞMADAN sığmalı: metin etiketleri
          kademeli olarak devreye girer (ipucu sayacı 360'tan, "+15sn" yazısı
          400'den sonra), böylece en dar telefonda bile hiçbir düğme kırpılmaz. */}
      <header className="flex shrink-0 items-center gap-1 px-1 py-1 sm:gap-2 sm:px-3">
        <Link href="/" aria-label="Oyundan çık, ana sayfaya dön"
          className="flex h-11 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-raised)] hover:text-[var(--ink)]">
          <ChevronLeft aria-hidden className="h-6 w-6" />
        </Link>
        <LetterTile difficulty={puzzle.difficulty} size="sm" />
        <span className="font-display text-lg font-semibold leading-none text-[var(--ink)]">
          #{puzzleNumber}
        </span>
        <span className="ml-auto hidden shrink-0 font-mono text-xs tabular-nums text-[var(--ink-soft)] min-[360px]:inline">
          {solvedCount}/{totalCount}
        </span>
        {session && (
          <span className="ml-auto shrink-0 rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-2 py-1.5 min-[360px]:ml-0">
            <Timer startedAt={session.startedAt} serverNow={session.serverNow}
              penaltyMs={penaltyMs} finalMs={result?.durationMs ?? null} />
          </span>
        )}
        {/* Masaüstünde liste hep görünür olduğundan düğme yalnızca dar ekranda */}
        <button type="button" onClick={() => setListOpen(true)} onPointerDown={(e) => e.preventDefault()} aria-label="Tüm ipuçları"
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-raised)] lg:hidden">
          <List aria-hidden className="h-[18px] w-[18px]" />
        </button>
        <button type="button" onClick={hint} disabled={hintBusy} onPointerDown={(e) => e.preventDefault()} aria-label="İpucu al (+15 saniye ceza)"
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 text-sm font-medium text-[var(--ink)] transition-transform active:scale-95 disabled:opacity-60">
          <Lightbulb aria-hidden className={`h-4 w-4 shrink-0 text-[var(--accent)] ${hintBusy ? 'animate-pulse' : ''}`} />
          <span className="hidden min-[380px]:inline">{hintBusy ? '…' : '+15sn'}</span>
        </button>
      </header>

      {error && (
        <p role="status"
          className="mx-2 mb-1 shrink-0 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-center text-sm text-[var(--accent)]">
          {error}
        </p>
      )}

      <div className="play-layout min-h-0 flex-1 px-1.5 pb-1 sm:px-3 lg:mx-auto lg:w-full lg:max-w-6xl lg:px-6 lg:pb-3">
        {entry && (
          <div className="play-clue">
            <ClueBar entry={entry} solved={correctKeys.has(hashKey(entry.no, entry.dir))}
              onClearWord={clearWord}
              onPrev={() => dispatch({ type: 'NEXT_ENTRY', delta: -1 })}
              onNext={() => dispatch({ type: 'NEXT_ENTRY', delta: 1 })}
              onToggleDir={() => dispatch({ type: 'SELECT', row: state.sel.row, col: state.sel.col })} />
          </div>
        )}

        {/* Kare, ölçtüğümüz kutunun İÇİNDE mutlak konumlu (akış dışı) durur.
            Akışta olsaydı JS'in verdiği boyut kapsayıcının yüksekliğini
            büyütür, büyüyen kutu yeniden ölçülür ve grid her turda biraz daha
            şişerdi — yatay telefonda grid ekranın altından taşıyordu. Akış
            dışında kalınca ölçüm tek yönlü olur: kutu → kare, asla tersi. */}
        <div ref={gridAreaRef} className="play-grid relative py-1.5">
          <div ref={gridRef}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={gridPx !== null ? { width: gridPx, height: gridPx } : { visibility: 'hidden' }}>
            <Grid puzzle={puzzle} letters={state.letters} sel={state.sel}
              activeCells={activeCells} correctCells={correctCells} hintCells={hintCells}
              wrongCells={wrongCells} flashCell={flashCell} cellPx={cellPx} />
            {/* Grid'i tam kaplayan görünmez ama TIKLANABİLİR input: dokunuş
                doğrudan input'a gittiği için native klavye ilk dokunuşta açılır
                (başka öğeye dokunup programatik focus() mobilde güvenilmez).
                fontSize 16 ŞART: iOS 16 px'in altındaki input'a odaklanınca
                sayfayı YAKINLAŞTIRIR. user-select/touch-callout none +
                onContextMenu, iOS'in "Yapıştır / Seç" balonunu bastırır. */}
            <input ref={inputRef} type="text" inputMode="text" lang="tr"
              defaultValue={INPUT_PAD} aria-label="Bulmaca — harf gir"
              className="absolute inset-0 z-10 h-full w-full cursor-pointer select-none rounded-2xl bg-transparent text-transparent outline-none"
              style={{
                fontSize: 16, caretColor: 'transparent',
                WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
                // Odak halkası bastırılır: görünmez input odaklandığında
                // grid'in çevresinde koca bir mavi çerçeve beliriyordu. Odağın
                // görsel karşılığı zaten SEÇİLİ HÜCRE (halka + renk + büyütme).
                outline: 'none',
              }}
              autoCapitalize="off" autoCorrect="off" autoComplete="off"
              spellCheck={false} enterKeyHint="next"
              onInput={onNativeInput}
              onKeyDown={onInputKeyDown}
              onPointerDown={onGridPointer}
              onFocus={resetNativeInput}
              onContextMenu={(e) => e.preventDefault()} />
          </div>
        </div>

        <aside className="play-list">
          <div className="play-list-inner">
            <ClueList entries={puzzle.entries} active={entry} solvedKeys={correctKeys}
              onPick={(e) => pickEntry(e.no, e.dir)} />
            <button type="button" onClick={clearAll}
              className="mt-2 flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--line)] text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-raised)]">
              <Trash2 aria-hidden className="h-4 w-4" /> Tümünü Temizle
            </button>
          </div>
        </aside>
      </div>

      {/* Mobil ipucu paneli: 10×10'da 20 ipucunu tek şeritten görmek imkânsızdı.
          Kare bulmacanın olmazsa olmazı olan "bütün ipuçlarını tara" hareketi. */}
      {listOpen && (
        <div role="dialog" aria-modal="true" aria-label="Tüm ipuçları"
          className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)] lg:hidden"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-3 py-2">
            <p className="font-display text-xl font-semibold">İpuçları</p>
            <button type="button" onClick={() => setListOpen(false)} aria-label="Kapat"
              className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-soft)] hover:bg-[var(--paper-raised)]">
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
            <ClueList entries={puzzle.entries} active={entry} solvedKeys={correctKeys}
              onPick={(e) => pickEntry(e.no, e.dir)} />
            <button type="button" onClick={() => { clearAll(); setListOpen(false); }}
              className="mt-2 flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--line)] text-sm text-[var(--ink-soft)]">
              <Trash2 aria-hidden className="h-4 w-4" /> Tümünü Temizle
            </button>
          </div>
        </div>
      )}

      <FinishDialog open={phase === 'done'} durationMs={result?.durationMs ?? 0}
        rank={result?.rank ?? null} isRanked={result?.isRanked ?? false}
        streak={result?.streak ?? null}
        hintCount={hintCount} puzzleNumber={puzzleNumber} difficulty={puzzle.difficulty}
        date={puzzle.date} />
    </div>
  );
}
