import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ArchiveDayCard } from '@/components/archive/ArchiveDayCard';
import { formatTrtDayNumber, formatTrtMonth, formatTrtWeekday, puzzleNumber } from '@/lib/date';
import { DIFFICULTIES } from '@/lib/types';

// Arşivin görsel katmanı, veri katmanından ayrı: sayfa yalnızca sorgu atar,
// yerleşim/tipografi burada. Böylece tasarım gerçek veriye ihtiyaç duymadan
// da render edilip doğrulanabiliyor.
export function ArchiveGallery({ dates, doneMs, page, pageCount, totalDays }: {
  dates: string[];
  doneMs: Map<string, number | null>;
  page: number; pageCount: number; totalDays: number;
}) {
  const pageHref = (p: number): string => (p <= 1 ? '/archive' : `/archive?sayfa=${p}`);
  const solvedOnPage = dates.filter((d) => DIFFICULTIES.every((x) => doneMs.has(`${d}:${x}`))).length;

  return (
    <>
      {/* Editoryal künye: ince kurallar arasında harflenmiş bir üst başlık —
          gazete arşivi kapağı hissi. */}
      <header className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="h-px w-10 bg-[var(--line)] sm:w-20" />
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[var(--ink-soft)]">
            Geçmiş Nüshalar
          </p>
          <span aria-hidden className="h-px w-10 bg-[var(--line)] sm:w-20" />
        </div>
        <h1 className="font-display-flourish mt-3 bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text font-display text-4xl text-transparent sm:text-5xl">
          Arşiv
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Geçmiş bulmacalar pratik içindir; süren sıralamaya girmez.
        </p>
        {totalDays > 0 && (
          <p className="mt-1 font-mono text-xs text-[var(--ink-soft)]">
            {totalDays} gün · {totalDays * 3} bulmaca
            {solvedOnPage > 0 && ` · bu sayfada ${solvedOnPage} gün tamamlandı`}
          </p>
        )}
      </header>

      {dates.length === 0 && (
        <p className="py-16 text-center text-[var(--ink-soft)]">
          Arşiv, lansmandan sonra dolmaya başlayacak.
        </p>
      )}

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dates.map((date) => (
          <ArchiveDayCard key={date} date={date}
            dayNumber={formatTrtDayNumber(date)}
            weekday={formatTrtWeekday(date)}
            monthName={formatTrtMonth(date)}
            puzzleNo={puzzleNumber(date)}
            doneMs={doneMs} />
        ))}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Arşiv sayfaları" className="mt-10 flex items-center justify-center gap-3">
          {page > 1
            ? <Link href={pageHref(page - 1)} rel="prev"
                className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-4 text-sm font-medium transition-colors hover:bg-[var(--accent-soft)] sm:w-[8.5rem] sm:px-0">
                <ChevronLeft aria-hidden className="h-4 w-4" /> Daha Yeni
              </Link>
            : <span aria-hidden className="hidden sm:block sm:h-11 sm:w-[8.5rem]" />}

          <span className="shrink-0 text-center font-mono text-sm tabular-nums text-[var(--ink-soft)]">
            {page} <span className="text-[var(--line)]">/</span> {pageCount}
          </span>

          {page < pageCount
            ? <Link href={pageHref(page + 1)} rel="next"
                className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-4 text-sm font-medium transition-colors hover:bg-[var(--accent-soft)] sm:w-[8.5rem] sm:px-0">
                Daha Eski <ChevronRight aria-hidden className="h-4 w-4" />
              </Link>
            : <span aria-hidden className="hidden sm:block sm:h-11 sm:w-[8.5rem]" />}
        </nav>
      )}
    </>
  );
}
