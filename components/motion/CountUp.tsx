// Sıfırdan hedefe sayan rakam — tamamen CSS (globals.css → .count-up).
// Görsel sayı bir CSS sayacıdır ve yardımcı teknolojiye güvenilir biçimde
// okunmaz; gerçek değer sr-only olarak yanında durur.
export function CountUp({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="count-up tabular-nums" style={{ '--to': value } as React.CSSProperties} />
    </span>
  );
}
