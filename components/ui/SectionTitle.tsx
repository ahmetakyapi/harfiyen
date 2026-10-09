// Sayfalar arasında ortak bölüm başlığı. Eskiden harflenmiş (büyük harf +
// geniş aralık, 11 px) idi; okunmuyordu. Artık normal yazım, okunur boy.
export function SectionTitle({ children, className = '' }: {
  children: string; className?: string;
}) {
  return (
    <h2 className={`mb-2 mt-8 text-sm font-semibold text-[var(--ink)] ${className}`}>
      {children}
    </h2>
  );
}
