import type { Difficulty } from './types';

const LABELS: Record<Difficulty, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
// Wordle'ın renkli kare mantığının Harfiyen karşılığı: zorluk seviyesi renkli bir
// yuvarlakla anında okunur, cevaplara dair hiçbir sızıntı içermez.
const DIFFICULTY_EMOJI: Record<Difficulty, string> = { easy: '🟢', medium: '🟡', hard: '🔴' };

// Özel alan adına geçildiğinde ya da önizleme dağıtımlarında paylaşım metninin
// yanlış adrese işaret etmemesi için env'den okunur.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://harfiyen.vercel.app';
const TAGLINE = 'harfiyen • günlük kelime bulmacası';

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Bulmacanın kendi deseninden bir emoji ızgarası: ⬛ bloklu hücre,
 * 🟧 harfi açılmış hücre, 🟩 kendi çözdüğün hücre.
 *
 * Sızıntı yok: `black` deseni zaten istemciye gidiyor (ClientPuzzle) ve hiçbir
 * HARF taşınmıyor. Taşıdığı tek yeni bilgi oyuncunun kaç harf açtığı — ki bunu
 * zaten metnin kendisi de yazıyor. Wordle'ın yayılmasını sağlayan da süre
 * değil, bakınca "nasıl gitti" diye okunan bu görseldi.
 */
export function buildShareGrid(black: boolean[][], hintCells: Iterable<string>): string[] {
  const hints = new Set(hintCells);
  return black.map((row, r) =>
    row.map((isBlack, c) => (isBlack ? '⬛' : hints.has(`${r}:${c}`) ? '🟧' : '🟩')).join(''),
  );
}

export function buildShareText(opts: {
  number: number; difficulty: Difficulty; durationMs: number;
  rank?: number | null; hintCount?: number;
  /** Kişisel rekor kırıldıysa metne bir satır eklenir. */
  isPersonalBest?: boolean;
  /** Süre dağılımındaki yeri ("çözenlerin %78'inden hızlı"). */
  fasterThanPct?: number | null;
  /** buildShareGrid çıktısı; verilmezse ızgara satırı hiç eklenmez. */
  gridLines?: string[];
}): string {
  const lines = [
    `🧩 Harfiyen #${opts.number} · ${DIFFICULTY_EMOJI[opts.difficulty]} ${LABELS[opts.difficulty]}`,
    `⏱ ${formatDuration(opts.durationMs)}${opts.rank != null ? ` · 🏅 ${opts.rank}. sıra` : ''}`,
  ];
  if (opts.isPersonalBest) lines.push('🏆 Yeni rekor');
  if (opts.fasterThanPct != null && opts.fasterThanPct > 0) {
    lines.push(`📈 Çözenlerin %${opts.fasterThanPct}'inden hızlı`);
  }
  if (opts.hintCount) lines.push(`💡 ${opts.hintCount} harf açıldı`);
  if (opts.gridLines && opts.gridLines.length > 0) lines.push('', ...opts.gridLines);
  lines.push('', TAGLINE, SITE_URL);
  return lines.join('\n');
}
