import { trUpper } from '@/lib/tr';

// Sayfalar arasında ortak bölüm başlığı: harflenmiş, ince, mürekkep-soluk.
// Büyük harf CSS ile DEĞİL trUpper ile yapılır — `text-transform: uppercase`
// Safari'de dile duyarlı değildir ("Geçmiş" → "GEÇMIŞ").
export function SectionTitle({ children, className = '' }: {
  children: string; className?: string;
}) {
  return (
    <h2 className={`mb-2 mt-8 text-[0.7rem] font-bold tracking-[0.16em] text-[var(--ink-soft)] ${className}`}>
      {trUpper(children)}
    </h2>
  );
}
