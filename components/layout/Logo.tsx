// Harfiyen'in imzası: tek parça, yuvarlatılmış geometrik bir "H" monogramı.
// Kollar ink renginde, ortadaki çubuk vurgu renginde — kesişme fikrini (kelimelerin
// birbirini kestiği an) tek bir zarif çizgiyle taşır; harf-kutucuklu ilk sürüm
// "oyuncak blok" gibi durduğu için tek parça, sade bir monograma geçildi.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <rect x="13" y="9" width="11" height="46" rx="5.5" fill="var(--ink)" />
      <rect x="40" y="9" width="11" height="46" rx="5.5" fill="var(--ink)" />
      <rect x="13" y="26.5" width="38" height="11" rx="5.5" fill="var(--accent)" />
    </svg>
  );
}
