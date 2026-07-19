export const metadata = { title: 'Nasıl oynanır' };

const STEPS = [
  ['İpucunu oku', 'Her kelimenin gazete bulmacası tarzında kısa bir ipucu var. Numara ve yön (soldan sağa / yukarıdan aşağıya) ipucu şeridinde yazar.'],
  ['Hücreye dokun, yaz', 'Hücreye dokununca kelime seçilir; ikinci dokunuş yönü değiştirir. Harfler otomatik olarak sonraki boş hücreye ilerler.'],
  ['Kesişimleri kullan', 'Bir kelimeyi çözmek, kesiştiği kelimelere harf kazandırır. Doğru tamamlanan kelime yeşil yanar.'],
  ['Takılırsan ipucu al', 'Seçili hücrenin harfini açar; karşılığında sürene +15 saniye eklenir.'],
  ['Süreni yarıştır', 'Süre "Başla" dediğin an başlar, bulmaca bitince durur. Üyeler günün sıralamasına girer; her gün 09:00\'da üç yeni bulmaca gelir.'],
] as const;

export default function HowToPlayPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-center font-display text-3xl">Nasıl oynanır?</h1>
      <ol className="mt-8 space-y-6">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-display text-white">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
