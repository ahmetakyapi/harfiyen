import Link from 'next/link';
import { Check } from 'lucide-react';
import { LetterTile } from '@/components/ui/LetterTile';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { formatDuration } from '@/lib/share';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

// Arşiv kartı = bir gazete nüshası. Büyük display rakamı gün, üstünde ay adı
// ve künye gibi duran baskı numarası; altında o günün üç bulmacası. Üç bulmaca
// da çözülmüşse köşeye hafif eğik bir "TAMAMLANDI" mührü basılır — temanın
// mühür/vermilyon diliyle, arşive göz gezdirirken tamamlananları bir bakışta
// ayırt ettiren sessiz bir ödül.
export function ArchiveDayCard({ date, dayNumber, weekday, monthName, puzzleNo, doneMs }: {
  date: string; dayNumber: string; weekday: string; monthName: string;
  puzzleNo: number; doneMs: Map<string, number | null>;
}) {
  const solved = DIFFICULTIES.filter((d) => doneMs.has(`${date}:${d}`));
  const allDone = solved.length === DIFFICULTIES.length;

  return (
    <section
      className={`group relative overflow-hidden rounded-[1.4rem] border bg-[var(--paper-raised)] transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 ${
        allDone
          ? 'border-[var(--correct)]/35 shadow-[0_14px_40px_-30px_var(--correct)]'
          : 'border-[var(--line)] shadow-[0_14px_40px_-32px_var(--ink)] hover:shadow-[0_20px_50px_-28px_var(--ink)]'
      }`}>
      {/* Kâğıt kenarı hissi: üstte zorluk merdivenini taşıyan çok ince bir cetvel */}
      <div aria-hidden className="flex h-[3px] w-full">
        <span className="flex-1 bg-[var(--diff-easy)]/50" />
        <span className="flex-1 bg-[var(--diff-medium)]/50" />
        <span className="flex-1 bg-[var(--diff-hard)]/50" />
      </div>

      <header className="flex items-baseline gap-2.5 px-4 pb-2 pt-3.5">
        <span className="font-display text-[2.6rem] font-semibold leading-none tracking-tight text-[var(--ink)]">
          {dayNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm text-[var(--ink)]">{monthName}</span>
          <span className="block text-[0.7rem] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            {weekday}
          </span>
        </span>
        {/* Künye sütunu: baskı numarası, altında (gün tamamlandıysa) mühür.
            Mühür AKIŞ İÇİNDE duruyor — mutlak konumlandırıldığında baskı
            numarasının üstüne biniyordu. */}
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-mono text-[0.7rem] text-[var(--ink-soft)]">#{puzzleNo}</span>
          {allDone && (
            // Dekoratif: "3/3 çözüldü" bilgisi zaten aşağıdaki satırlardan geliyor.
            <span aria-hidden
              className="-rotate-[7deg] select-none rounded-md border-2 border-[var(--correct)]/40 px-1.5 py-0.5 font-display text-[0.55rem] font-bold uppercase tracking-[0.16em] text-[var(--correct)]/60">
              Tamamlandı
            </span>
          )}
        </span>
      </header>

      <div className="mx-4 border-t border-dashed border-[var(--line)]" />

      <div className="divide-y divide-[var(--line)]/60">
        {DIFFICULTIES.map((d) => {
          const key = `${date}:${d}`;
          const isDone = doneMs.has(key);
          const ms = doneMs.get(key) ?? null;
          return (
            <Link key={d} href={`/play/${date}/${d}`}
              className="flex min-h-11 items-center gap-2.5 px-4 py-2 transition-colors hover:bg-[var(--paper)]"
              aria-label={`${dayNumber} ${monthName} ${DIFFICULTY_LABELS[d]}${isDone ? ' — çözüldü' : ''}`}>
              <LetterTile difficulty={d} size="sm" />
              <span className="flex-1 text-sm font-medium">{DIFFICULTY_LABELS[d]}</span>
              {isDone
                ? <span className="flex items-center gap-1 rounded-full bg-[var(--correct-soft)] px-2 py-1 text-[0.7rem] font-semibold text-[var(--correct)]">
                    <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
                    {ms !== null && <span className="font-mono tabular-nums">{formatDuration(ms)}</span>}
                  </span>
                : <span className="text-xs text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent)]">
                    Oyna →
                  </span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export type { Difficulty };
