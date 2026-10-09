// Değişen her karakter kendi anahtarıyla yeniden bağlanır ve yukarıdan düşer
// (globals.css → .roll). Konum anahtarın parçası: "09" → "10" geçişinde iki
// hane de ayrı ayrı düşer, değişmeyen haneler yerinde kalır.
export function RollingText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`roll ${className}`}>
      {Array.from(text).map((ch, i) => (
        <span key={`${i}:${ch}`}>{ch}</span>
      ))}
    </span>
  );
}
