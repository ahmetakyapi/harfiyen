'use client';

import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  LAUNCH_DATE, TR_WEEKDAY_LONG, TR_WEEKDAY_SHORT, addDays, addMonths, formatTrtDate,
  formatTrtMonth, monthGrid, monthOf, weekdayIndex,
} from '@/lib/date';

import { type CalendarCellState, cellStateOf } from '@/lib/game/calendar';

type CalendarDay = { date: string; puzzleCount: number; doneCount: number };

export function DatePicker({ selected, today, onSelect, label, maxSelectable }: {
  /** Seçili gün (YYYY-MM-DD). Panel bu ayda açılır. */
  selected: string;
  /** Oyun günü — bundan sonrası "henüz yayınlanmadı". */
  today: string;
  onSelect: (date: string) => void;
  /** Tetikleyici düğmenin içeriği; verilmezse tarih + gün adı basılır. */
  label?: React.ReactNode;
  /** Seçilebilir en son gün. Arşivde dün (bugünün bulmacası arşivde değil).
   *  Verilmezse `today`. "Henüz yayınlanmadı" etiketi yine `today`ye bakar,
   *  yani bugün yanlışlıkla "yayınlanmadı" diye gösterilmez. */
  maxSelectable?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => monthOf(selected));
  const [focusDate, setFocusDate] = useState(selected);
  // Ay → gün verisi. Açıkken çekilir ve bileşen ömrü boyunca saklanır:
  // aynı aya dönüldüğünde ikinci bir tur atılmaz.
  const [cache, setCache] = useState<Record<string, CalendarDay[]>>({});
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const ceiling = maxSelectable ?? today;
  const minMonth = monthOf(LAUNCH_DATE);
  const maxMonth = monthOf(ceiling);
  const cells = useMemo(() => monthGrid(month), [month]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const d of cache[month] ?? []) map.set(d.date, d);
    return map;
  }, [cache, month]);

  // İşaret verisi yalnızca panel AÇIKKEN ve ay başına BİR KEZ çekilir.
  useEffect(() => {
    if (!open || cache[month]) return;
    const from = cells[0];
    const to = cells[cells.length - 1];
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
        if (!res.ok) throw new Error('takvim alınamadı');
        const body = (await res.json()) as { days: CalendarDay[] };
        if (!cancelled) setCache((c) => ({ ...c, [month]: body.days }));
      } catch {
        // İşaretler gelmese de takvim gezilebilir kalır: hücrelerin tarih ve
        // aralık bilgisi istemcide türetiliyor, yalnızca işaretleme katmanı
        // eksik olur.
        if (!cancelled) setCache((c) => ({ ...c, [month]: [] }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, month, cells, cache]);

  useFocusTrap(panelRef, open);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const stateOf = useCallback(
    (date: string): CalendarCellState =>
      cellStateOf({ date, month, today, day: byDate.get(date) }),
    [byDate, month, today],
  );

  // Komşu ay hücreleri TIKLANAMAZ: yalnızca yön içindirler. Tıklanabilir
  // olsalardı sessizce ay değiştirirlerdi.
  const selectable = useCallback(
    (date: string): boolean =>
      date >= LAUNCH_DATE && date <= ceiling && monthOf(date) === month,
    [ceiling, month],
  );

  const move = useCallback((from: string, delta: number) => {
    const next = addDays(from, delta);
    // Hareket her zaman [LAUNCH_DATE, ceiling] aralığına kırpılır.
    const clamped = next < LAUNCH_DATE ? LAUNCH_DATE : next > ceiling ? ceiling : next;
    setFocusDate(clamped);
    // Ay kenarını aşan hareket ayı kendiliğinden çevirir — 40 gün geriye
    // gitmenin 40 tık olduğu derdin asıl çözümü bu.
    if (monthOf(clamped) !== month) setMonth(monthOf(clamped));
  }, [month, ceiling]);

  const onGridKeyDown = (e: React.KeyboardEvent): void => {
    const map: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    if (e.key in map) { e.preventDefault(); move(focusDate, map[e.key]); return; }
    if (e.key === 'Home') { e.preventDefault(); move(focusDate, -weekdayIndex(focusDate)); return; }
    if (e.key === 'End') { e.preventDefault(); move(focusDate, 6 - weekdayIndex(focusDate)); return; }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      const step = e.key === 'PageUp' ? -1 : 1;
      const target = `${addMonths(monthOf(focusDate), step)}-${focusDate.slice(8)}`;
      const clamped = target < LAUNCH_DATE ? LAUNCH_DATE : target > ceiling ? ceiling : target;
      setFocusDate(clamped);
      setMonth(monthOf(clamped));
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  // Odak, ızgarada gezinen tek hücrede tutulur (roving tabindex).
  useEffect(() => {
    if (!open) return;
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-date="${focusDate}"]`);
    el?.focus();
  }, [focusDate, open, month]);

  useEffect(() => {
    if (!open) return;
    setMonth(monthOf(selected));
    setFocusDate(selected);
  }, [open, selected]);

  const monthDays = cells.filter((d) => monthOf(d) === month);
  const published = monthDays.filter(
    (d) => stateOf(d) === 'oynanmis' || stateOf(d) === 'oynanmamis',
  ).length;
  const solved = monthDays.filter((d) => (byDate.get(d)?.doneCount ?? 0) > 0).length;

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}
        aria-haspopup="dialog" aria-expanded={open}
        aria-label={`Tarih Seç — şu an ${formatTrtDate(selected)}`}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 transition-colors hover:bg-[var(--paper-raised)]">
        {label ?? <span className="font-medium">{formatTrtDate(selected)}</span>}
        <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-[var(--ink-soft)]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] backdrop-blur-sm sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Tarih Seç"
            // max-h + iç kaydırma: yatay telefonda ve kısa pencerede gösterge
            // satırı ekranın altında kalmasın.
            className="max-h-[92dvh] w-full max-w-[22rem] overflow-y-auto overscroll-contain rounded-t-[1.6rem] border border-[var(--line)] bg-[var(--paper-raised)] px-0.5 pb-[env(safe-area-inset-bottom)] pt-2 shadow-2xl sm:rounded-[1.6rem] sm:pb-2">
            {/* Ay başlığı: üç sütun sabit — sınırda ok GİZLENMEZ, disabled olur;
                yerleşim zıplamaz ve kontrol keşfedilebilir kalır. */}
            <div className="flex items-center justify-between px-2">
              <button type="button" aria-label="Önceki ay" disabled={month <= minMonth}
                onClick={() => setMonth(addMonths(month, -1))}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] disabled:opacity-30">
                <ChevronLeft aria-hidden className="h-5 w-5" />
              </button>
              <h2 id="cal-month" className="font-display text-lg font-semibold">
                {formatTrtMonth(`${month}-01`)}
              </h2>
              <div className="flex">
                <button type="button" aria-label="Sonraki ay" disabled={month >= maxMonth}
                  onClick={() => setMonth(addMonths(month, 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] disabled:opacity-30">
                  <ChevronRight aria-hidden className="h-5 w-5" />
                </button>
                <button type="button" onClick={close} aria-label="Kapat"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] sm:hidden">
                  <X aria-hidden className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Ekran okuyucu ayın şeklini 42 hücre gezmeden alsın. */}
            <p role="status" aria-live="polite" className="sr-only">
              {formatTrtMonth(`${month}-01`)}. {published} günün bulmacası var, {solved} gün oynandı.
            </p>

            <div role="grid" aria-labelledby="cal-month" aria-busy={loading || undefined}
              ref={gridRef} onKeyDown={onGridKeyDown} className="mt-1 px-0.5 pb-1">
              <div role="row" className="grid grid-cols-7 gap-px">
                {TR_WEEKDAY_SHORT.map((d, i) => (
                  <span key={d} role="columnheader" aria-label={TR_WEEKDAY_LONG[i]}
                    className="flex h-7 items-center justify-center font-mono text-[0.65rem] text-[var(--ink-soft)]">
                    {d}
                  </span>
                ))}
              </div>
              {/* Sabit 6 hafta: ay değişince panel boyu zıplamaz. */}
              {Array.from({ length: 6 }, (_, week) => (
                <div key={week} role="row" className="grid grid-cols-7 gap-px">
                  {cells.slice(week * 7, week * 7 + 7).map((date) => (
                    <Cell key={date} date={date} state={stateOf(date)}
                      day={byDate.get(date)}
                      isToday={date === today}
                      isSelected={date === selected}
                      tabIndex={date === focusDate ? 0 : -1}
                      disabled={!selectable(date)}
                      onPick={() => { onSelect(date); setOpen(false); }}
                      onFocusCell={() => setFocusDate(date)} />
                  ))}
                </div>
              ))}
            </div>

            <Legend />
          </div>
        </div>
      )}
    </>
  );
}

function Cell({
  date, state, day, isToday, isSelected, tabIndex, disabled, onPick, onFocusCell,
}: {
  date: string; state: CalendarCellState; day?: { puzzleCount: number; doneCount: number };
  isToday: boolean; isSelected: boolean; tabIndex: number; disabled: boolean;
  onPick: () => void; onFocusCell: () => void;
}) {
  const dayNo = Number(date.slice(8));
  // Komşu ay hücresi: yalnızca yön için. Ne işaret taşır ne odak alır —
  // aksi hâlde gri alanın içinde yeşil "oynadın" kareleri beliriyordu.
  if (state === 'ay-disi') {
    return (
      <div role="gridcell" aria-hidden
        className="flex aspect-square min-h-11 items-center justify-center text-sm text-[var(--ink-soft)]/30">
        {dayNo}
      </div>
    );
  }

  const done = day?.doneCount ?? 0;
  const total = day?.puzzleCount ?? 3;
  const complete = total > 0 && done >= total;

  // Her durum RENKTEN BAĞIMSIZ ikinci bir sinyal taşır:
  //  · yok           → çapraz tarama dokusu (oyundaki bloklu hücrenin dili)
  //  · yayınlanmadı  → HİÇ döşeme yok (boşluk)
  //  · oynanmamış    → kenarlı düz kâğıt döşeme, alt cetvel yok
  //  · oynanmış      → alt kenarda SAYILABİLİR segmentler (1/3, 2/3, 3/3)
  //
  // "oynanmamış"a kenar çizgisi ŞART: --paper döşemesi, panelin
  // --paper-raised zemininde neredeyse görünmüyordu; "bulmaca var" ile
  // "henüz yayınlanmadı" tonla ayrışmıyordu. Ayrım artık yapısal:
  // döşeme VAR / döşeme YOK.
  const base = 'relative flex aspect-square min-h-11 flex-col items-center justify-center text-sm';
  const tone = isSelected
    ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
    : state === 'yok'
      ? 'cell-void text-[var(--ink-soft)]/50'
      : state === 'yayinlanmadi'
        ? 'text-[var(--ink-soft)]/30'
        : complete
          ? 'bg-[var(--correct-soft)] text-[var(--ink)] font-semibold ring-1 ring-inset ring-[var(--correct)]/45'
          : 'bg-[var(--paper)] text-[var(--ink)] ring-1 ring-inset ring-[var(--line)]';
  const ring = isToday && !isSelected ? 'ring-2 ring-inset ring-[var(--accent)]' : '';

  const label = `${formatTrtDate(date)}, ${TR_WEEKDAY_LONG[weekdayIndex(date)]}.`
    + (isToday ? ' Bugün.' : '')
    + (state === 'yayinlanmadi' ? ' Henüz yayınlanmadı.'
      : state === 'yok' ? ' Bulmaca yok.'
        : done > 0 ? ` ${done} / ${total} bölüm tamamlandı.`
          : ' Bulmaca var, henüz oynamadın.');

  return (
    <div role="gridcell" aria-selected={isSelected || undefined}>
      <button type="button" data-date={date} tabIndex={tabIndex}
        onClick={disabled ? undefined : onPick}
        onFocus={onFocusCell}
        aria-disabled={disabled || undefined}
        aria-current={isToday ? 'date' : undefined}
        aria-label={label}
        className={`w-full ${base} ${tone} ${ring} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
        <span aria-hidden>{dayNo}</span>
        {/* Üç segmentli alt cetvel: kolay → orta → zor. Misafirde ve
            oynanmamış günde HİÇ render edilmez (boş segment "0/3" yalanı olurdu). */}
        {done > 0 && (
          <span aria-hidden className="absolute inset-x-1 bottom-1 grid grid-cols-3 gap-px">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-[3px] rounded-full ${
                i < done
                  ? (isSelected ? 'bg-[var(--paper)]' : 'bg-[var(--correct)]')
                  : (isSelected ? 'bg-[var(--paper)]/30' : 'bg-[var(--line)]')
              }`} />
            ))}
          </span>
        )}
      </button>
    </div>
  );
}

function Legend() {
  const item = 'flex items-center gap-1.5';
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-[var(--line)] px-3 py-2 text-[0.7rem] text-[var(--ink-soft)]">
      <span className={item}>
        <span aria-hidden className="h-3.5 w-3.5 rounded-[3px] bg-[var(--paper)] ring-1 ring-inset ring-[var(--line)]" />
        Bulmaca Var
      </span>
      <span className={item}>
        <span aria-hidden className="relative h-3.5 w-3.5 rounded-[3px] bg-[var(--paper)] ring-1 ring-inset ring-[var(--line)]">
          <span className="absolute inset-x-px bottom-px grid grid-cols-3 gap-px">
            <span className="h-[2px] rounded-full bg-[var(--correct)]" />
            <span className="h-[2px] rounded-full bg-[var(--correct)]" />
            <span className="h-[2px] rounded-full bg-[var(--line)]" />
          </span>
        </span>
        Oynadın
      </span>
      <span className={item}>
        <span aria-hidden className="cell-void h-3.5 w-3.5 rounded-[3px]" />
        Bulmaca Yok
      </span>
    </div>
  );
}
