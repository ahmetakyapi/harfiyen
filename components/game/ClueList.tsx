'use client';

import { Check } from 'lucide-react';
import { hashKey, type Direction, type Entry } from '@/lib/types';

const DIR_TITLE: Record<Direction, string> = {
  across: 'Soldan Sağa',
  down: 'Yukarıdan Aşağıya',
};

// Kare bulmacanın olmazsa olmazı: tüm ipuçlarını bir arada görmek. Tek satırlık
// ipucu şeridi 20 kelimelik bir 10×10'da oyuncuyu kör uçuşa mahkûm ediyordu —
// çözücüler ipuçlarını tarayıp "bildiğim birinden" başlar. Masaüstünde grid'in
// yanında sabit, mobilde başlıktaki liste düğmesinden açılan panelde aynı bileşen.
function Column({ entries, dir, active, solvedKeys, onPick }: {
  entries: Entry[]; dir: Direction; active: Entry | null;
  solvedKeys: Set<string>; onPick: (entry: Entry) => void;
}) {
  const list = entries.filter((e) => e.dir === dir).sort((a, b) => a.no - b.no);
  return (
    <div className="min-w-0 flex-1">
      <p className="sticky top-0 z-10 bg-[var(--paper)] pb-1.5 pt-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
        {DIR_TITLE[dir]}
      </p>
      <ul className="flex flex-col">
        {list.map((e) => {
          const solved = solvedKeys.has(hashKey(e.no, e.dir));
          const isActive = active !== null && active.no === e.no && active.dir === e.dir;
          return (
            <li key={hashKey(e.no, e.dir)}>
              <button type="button" onClick={() => onPick(e)}
                aria-current={isActive || undefined}
                className={`flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors xl:text-[0.9375rem] ${
                  isActive
                    ? 'bg-[var(--cell-word)] font-medium text-[var(--ink)]'
                    : 'hover:bg-[var(--paper-raised)]'
                } ${solved && !isActive ? 'text-[var(--ink-soft)]' : ''}`}>
                <span className="w-5 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-[var(--ink-soft)]">
                  {e.no}
                </span>
                <span className={`min-w-0 flex-1 leading-snug ${solved ? 'line-through decoration-[var(--correct)] decoration-2' : ''}`}>
                  {e.clue}
                </span>
                {solved && <Check aria-label="çözüldü" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--correct)]" strokeWidth={3} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ClueList({ entries, active, solvedKeys, onPick, layout = 'stacked' }: {
  entries: Entry[]; active: Entry | null; solvedKeys: Set<string>;
  onPick: (entry: Entry) => void;
  layout?: 'stacked' | 'columns'; // stacked: dar panel (masaüstü kenar çubuğu)
}) {
  return (
    <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
      layout === 'columns' ? 'flex gap-5' : 'flex flex-col gap-4'
    }`}>
      <Column entries={entries} dir="across" active={active} solvedKeys={solvedKeys} onPick={onPick} />
      <Column entries={entries} dir="down" active={active} solvedKeys={solvedKeys} onPick={onPick} />
    </div>
  );
}
