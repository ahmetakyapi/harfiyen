import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ArchiveDayCard } from '@/components/archive/ArchiveDayCard';
import { DateJump } from '@/components/calendar/DateJump';
import {
  formatTrtDayMonth, formatTrtDayNumber, formatTrtMonth, formatTrtWeekday, puzzleNumber,
} from '@/lib/date';
import { DIFFICULTIES } from '@/lib/types';
import { trUpper } from '@/lib/tr';
import { KineticTitle } from '@/components/motion/KineticTitle';

// Arşivin görsel katmanı, veri katmanından ayrı: sayfa yalnızca sorgu atar,
// yerleşim/tipografi burada. Böylece tasarım gerçek veriye ihtiyaç duymadan
// da render edilip doğrulanabiliyor.
export function ArchiveGallery({
  dates, doneMs, page, pageCount, totalDays, today, highlight, latest,
}: {
  dates: string[];
  doneMs: Map<string, number | null>;
  page: number; pageCount: number; totalDays: number;
  /** Oyun günü — takvimde bundan sonrası "henüz yayınlanmadı". */
  today: string;
  /** Takvimden seçilerek gelinen gün: kartı işaretlenir. */
  highlight: string | null;
  /** Arşivin en yeni günü — takvim bu güne kadar seçilebilir. */
  latest: string;
}) {
  const pageHref = (p: number): string => (p <= 1 ? '/archive' : `/archive?sayfa=${p}`);
  const solvedOnPage = dates.filter((d) => DIFFICULTIES.every((x) => doneMs.has(`${d}:${x}`))).length;

  return (
    <>
      {/* Editoryal künye: ince kurallar arasında harflenmiş bir üst başlık —
          gazete arşivi kapağı hissi. */}
      <header className="text-center">
        <div className="rise flex items-center justify-center gap-3">
          <span aria-hidden className="h-px w-10 bg-[var(--line)] sm:w-20" />
          <p className="text-[0.65rem] font-semibold tracking-[0.3em] text-[var(--ink-soft)]">
            {trUpper('Geçmiş Nüshalar')}
          </p>
          <span aria-hidden className="h-px w-10 bg-[var(--line)] sm:w-20" />
        </div>
        <KineticTitle text="Arşiv"
          className="font-display-flourish mt-3 font-display text-[2.75rem] leading-tight tracking-tight sm:text-6xl" />
        <p className="rise mt-2 text-sm text-[var(--ink-soft)]" style={{ '--i': 2 } as React.CSSProperties}>
          Geçmiş bulmacalar pratik içindir; süren sıralamaya girmez.
        </p>
        {totalDays > 0 && (
          <p className="rise mt-1 font-mono text-xs text-[var(--ink-soft)]" style={{ '--i': 3 } as React.CSSProperties}>
            {totalDays} gün · {totalDays * 3} bulmaca
            {solvedOnPage > 0 && ` · bu sayfada ${solvedOnPage} gün tamamlandı`}
          </p>
        )}
        {/* 12'şer sayfalarda ay öncesine gitmek onlarca tık ediyordu. */}
        {totalDays > 0 && (
          <div className="rise mt-4 flex justify-center" style={{ '--i': 4 } as React.CSSProperties}>
            <DateJump selected={highlight ?? latest} today={today} maxSelectable={latest}
              hrefPattern="/archive?gun={date}#gun-{date}"
              label={<span className="font-medium">Güne Git</span>} />
          </div>
        )}
        {highlight && (
          <p role="status" className="mt-3 text-sm text-[var(--ink-soft)]">
            {dates.includes(highlight)
              ? `${formatTrtDayMonth(highlight)} aşağıda işaretlendi.`
              : `${formatTrtDayMonth(highlight)} için bulmaca yok — en yakın günler aşağıda.`}
          </p>
        )}
      </header>

      {dates.length === 0 && (
        <p className="py-16 text-center text-[var(--ink-soft)]">
          Arşiv, lansmandan sonra dolmaya başlayacak.
        </p>
      )}

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* İlk sıra sayfa açılırken dağıtılır; sonrakiler kaydırdıkça gazete
            sayfası gibi üst kenarından katlanarak açılır (saf CSS, bkz.
            .reveal-fold). Animasyon sarmalayıcıda: kartın kendi hover
            transform'u ile çakışmasın. */}
        {dates.map((date, i) => (
          <div key={date} className={i < 3 ? 'deal' : 'reveal-fold'}
            style={{ '--i': i, '--tilt': (i % 3) - 1 } as React.CSSProperties}>
            <ArchiveDayCard date={date} highlighted={date === highlight}
              dayNumber={formatTrtDayNumber(date)}
              weekday={formatTrtWeekday(date)}
              monthName={formatTrtMonth(date)}
              puzzleNo={puzzleNumber(date)}
              doneMs={doneMs} />
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Arşiv sayfaları" className="mt-10 flex items-center justify-center gap-3">
          {page > 1
            ? <Link href={pageHref(page - 1)} rel="prev"
                className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-4 text-sm font-medium transition-colors hover:bg-[var(--row-hover)] sm:w-[8.5rem] sm:px-0">
                <ChevronLeft aria-hidden className="h-4 w-4" /> Daha Yeni
              </Link>
            : <span aria-hidden className="hidden sm:block sm:h-11 sm:w-[8.5rem]" />}

          <span className="shrink-0 text-center font-mono text-sm tabular-nums text-[var(--ink-soft)]">
            {page} <span className="text-[var(--line)]">/</span> {pageCount}
          </span>

          {page < pageCount
            ? <Link href={pageHref(page + 1)} rel="next"
                className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-4 text-sm font-medium transition-colors hover:bg-[var(--row-hover)] sm:w-[8.5rem] sm:px-0">
                Daha Eski <ChevronRight aria-hidden className="h-4 w-4" />
              </Link>
            : <span aria-hidden className="hidden sm:block sm:h-11 sm:w-[8.5rem]" />}
        </nav>
      )}
    </>
  );
}
