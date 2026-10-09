import Link from 'next/link';
import { Check } from 'lucide-react';
import { LetterTile } from '@/components/ui/LetterTile';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { formatDuration } from '@/lib/share';
import { trUpper } from '@/lib/tr';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

// Arşiv kartı = bir gazete nüshası. Büyük display rakamı gün, üstünde ay adı
// ve künye gibi duran baskı numarası; altında o günün üç bulmacası. Üç bulmaca
// da çözülmüşse köşeye hafif eğik bir "TAMAMLANDI" mührü basılır — temanın
// mühür/vermilyon diliyle, arşive göz gezdirirken tamamlananları bir bakışta
// ayırt ettiren sessiz bir ödül.
export function ArchiveDayCard({
  date, dayNumber, weekday, monthName, puzzleNo, doneMs, highlighted = false,
}: {
  date: string; dayNumber: string; weekday: string; monthName: string;
  puzzleNo: number; doneMs: Map<string, number | null>;
  /** Takvimden seçilerek gelinen gün: halka ile işaretlenir ve #gun-… ile
   *  tarayıcı buraya kaydırır (JS kapalıyken de çalışır). */
  highlighted?: boolean;
}) {
  const solved = DIFFICULTIES.filter((d) => doneMs.has(`${date}:${d}`));
  const allDone = solved.length === DIFFICULTIES.length;

  return (
    <section id={`gun-${date}`}
      className={`relative scroll-mt-20 overflow-hidden rounded-[1.4rem] border bg-[var(--paper-raised)] transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 ${
        highlighted
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--paper)]'
          : allDone
            ? 'border-[color:color-mix(in_srgb,var(--correct)_35%,transparent)] shadow-[0_14px_40px_-30px_var(--correct)]'
            : 'border-[var(--line)] shadow-[0_14px_40px_-32px_var(--ink)] hover:shadow-[0_20px_50px_-28px_var(--ink)]'
      }`}>
      {/* Kâğıt kenarı hissi: üstte zorluk merdivenini taşıyan çok ince bir cetvel */}
      <div aria-hidden className="flex h-[3px] w-full">
        <span className="flex-1 bg-[color:color-mix(in_srgb,var(--diff-easy)_50%,transparent)]" />
        <span className="flex-1 bg-[color:color-mix(in_srgb,var(--diff-medium)_50%,transparent)]" />
        <span className="flex-1 bg-[color:color-mix(in_srgb,var(--diff-hard)_50%,transparent)]" />
      </div>

      <header className="flex items-baseline gap-2.5 px-4 pb-2 pt-3.5">
        <span className="font-display text-[2.6rem] font-semibold leading-none tracking-tight text-[var(--ink)]">
          {dayNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm text-[var(--ink)]">{monthName}</span>
          <span className="block text-xs font-medium text-[var(--ink-soft)]">
            {weekday}
          </span>
        </span>
        {/* Künye sütunu: baskı numarası, altında (gün tamamlandıysa) mühür.
            Mühür AKIŞ İÇİNDE duruyor — mutlak konumlandırıldığında baskı
            numarasının üstüne biniyordu. */}
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          {/* Arşivden o günün sıralamasına geçiş yoktu; künye numarası artık
              oraya götürüyor. */}
          <Link href={`/leaderboard?date=${date}&difficulty=easy`}
            aria-label={`${dayNumber} ${monthName} sıralaması`}
            className="font-mono text-xs text-[var(--ink-soft)] underline-offset-2 hover:underline">
            #{puzzleNo}
          </Link>
          {allDone && (
            // Dekoratif: "3/3 çözüldü" bilgisi zaten aşağıdaki satırlardan geliyor.
            <span aria-hidden
              className="stamp -rotate-[7deg] select-none rounded-md border-2 border-[color:color-mix(in_srgb,var(--correct)_40%,transparent)] px-1.5 py-0.5 font-display text-xs font-bold tracking-[0.04em] text-[color:color-mix(in_srgb,var(--correct)_80%,transparent)]">
              {trUpper('Tamamlandı')}
            </span>
          )}
        </span>
      </header>

      <div className="mx-4 border-t border-dashed border-[var(--line)]" />

      <div className="divide-y divide-[color:color-mix(in_srgb,var(--line)_60%,transparent)]">
        {DIFFICULTIES.map((d) => {
          const key = `${date}:${d}`;
          const isDone = doneMs.has(key);
          const ms = doneMs.get(key) ?? null;
          return (
            <Link key={d} href={`/play/${date}/${d}`}
              className="group/row flex min-h-11 items-center gap-2.5 px-4 py-2 transition-colors hover:bg-[var(--paper)]"
              aria-label={`${dayNumber} ${monthName} ${DIFFICULTY_LABELS[d]}${isDone ? ' — çözüldü' : ''}`}>
              <span className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover/row:-rotate-[8deg] group-hover/row:scale-110">
                <LetterTile difficulty={d} size="sm" />
              </span>
              <span className="flex-1 text-sm font-medium">{DIFFICULTY_LABELS[d]}</span>
              {isDone
                ? <span className="flex items-center gap-1 rounded-full bg-[var(--correct-soft)] px-2 py-1 text-xs font-semibold text-[var(--correct)]">
                    <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
                    {ms !== null && <span className="font-mono tabular-nums">{formatDuration(ms)}</span>}
                  </span>
                : <span className="text-xs text-[var(--ink-soft)] transition-[color,transform] duration-500 ease-[var(--ease-expo)] group-hover/row:translate-x-1 group-hover/row:text-[var(--accent)]">
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
