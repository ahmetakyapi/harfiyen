import { createElement } from 'react';

// Harf harf yükselen başlık. Görsel harfler aria-hidden; ekran okuyucu tek
// parça metni sr-only kopyadan okur (harfleri tek tek hecelemesin diye).
// Kelimeler `white-space: nowrap` kutularda: satır kırılması kelime
// ortasından değil, kelime aralarından olur.
export function KineticTitle({ text, as = 'h1', className = '', delay = 0 }: {
  text: string;
  as?: 'h1' | 'h2' | 'p';
  className?: string;
  /** Harf sırası bu kadar kaydırılır — aynı sahnede ikinci bir başlık için. */
  delay?: number;
}) {
  let i = delay;
  const words = text.split(' ');
  return createElement(as, { className },
    <span className="sr-only">{text}</span>,
    <span aria-hidden>
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="kt-word">
            {Array.from(w).map((ch, ci) => (
              <span key={ci} className="kt-char" style={{ '--i': i++ } as React.CSSProperties}>{ch}</span>
            ))}
          </span>
          {wi < words.length - 1 && ' '}
        </span>
      ))}
    </span>,
  );
}
