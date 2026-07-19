export const metadata = { title: 'Nasıl Oynanır' };

const STEPS = [
  ['İpucunu Oku', 'Her kelimenin gazete bulmacası tarzında kısa bir ipucu var. Numara ve yön (soldan sağa / yukarıdan aşağıya) ipucu şeridinde yazar.'],
  ['Hücreye Dokun, Yaz', 'Hücreye dokununca kelime seçilir; ikinci dokunuş yönü değiştirir. Harfler otomatik olarak sonraki boş hücreye ilerler.'],
  ['Kesişimleri Kullan', 'Bir kelimeyi çözmek, kesiştiği kelimelere harf kazandırır. Doğru tamamlanan kelime yeşil yanar.'],
  ['Takılırsan İpucu Al', 'Seçili hücrenin harfini açar; karşılığında sürene +15 saniye eklenir.'],
  ['Süreni Yarıştır', 'Süre "Başla" dediğin an başlar, bulmaca bitince durur. Üyeler günün sıralamasına girer; her gün 09:00\'da üç yeni bulmaca gelir.'],
] as const;

export default function HowToPlayPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text text-center font-display text-3xl text-transparent">
        Nasıl Oynanır?
      </h1>
      <ol className="mt-8 space-y-3">
        {STEPS.map(([title, body], i) => (
          <li key={title}
            className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-4">
            {/* Adım numaraları oyunun hücre numaralandırma dilinde — köşeli taş */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-[var(--accent)] font-display font-semibold text-[var(--paper)]">
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
