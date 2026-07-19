// Harfiyen'in imzası: oyunun kendi ızgara diline ait üç hücrelik bir "L" parçası —
// gerçek gridde kullandığımız üç durumu (dolu/vurgu/kelime) birebir yansıtır,
// jenerik bir "kutu içinde harf" logosu yerine ürünün kendi görsel dilinden
// damıtılmış bir işaret olsun diye.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <rect x="6" y="6" width="26" height="26" rx="4" fill="var(--accent)" />
      <rect x="35" y="6" width="26" height="26" rx="4" fill="var(--paper-raised)" stroke="var(--line)" />
      <rect x="6" y="35" width="26" height="26" rx="4" fill="var(--ink)" />
      <text x="48" y="27" textAnchor="middle" dominantBaseline="central"
        fontFamily="var(--font-fraunces), Georgia, serif" fontWeight="600" fontSize="20"
        fill="var(--ink)">
        H
      </text>
    </svg>
  );
}
