import type { Difficulty } from './types';

const LABELS: Record<Difficulty, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
// Wordle'ın renkli kare mantığının Harfiyen karşılığı: zorluk seviyesi renkli bir
// yuvarlakla anında okunur, cevaplara dair hiçbir sızıntı içermez.
const DIFFICULTY_EMOJI: Record<Difficulty, string> = { easy: '🟢', medium: '🟡', hard: '🔴' };
export const SITE_URL = 'harfiyen.vercel.app';

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function buildShareText(opts: {
  number: number; difficulty: Difficulty; durationMs: number; rank?: number | null; hintCount?: number;
}): string {
  const lines = [
    `🧩 Harfiyen #${opts.number} · ${DIFFICULTY_EMOJI[opts.difficulty]} ${LABELS[opts.difficulty]}`,
    `⏱ ${formatDuration(opts.durationMs)}${opts.rank != null ? ` · 🏅 ${opts.rank}. sıra` : ''}`,
  ];
  if (opts.hintCount) lines.push(`💡 ${opts.hintCount} ipucu`);
  lines.push('', SITE_URL);
  return lines.join('\n');
}
