import Link from 'next/link';

export const metadata = {
  title: 'Nasıl Oynanır',
  description: 'Harfiyen nasıl oynanır: ipuçları, kesişimler, harf açma ve süre.',
};

const STEPS = [
  ['İpucunu Oku', 'Her kelimenin gazete bulmacası tarzında kısa bir ipucu var. Numara ve yön (soldan sağa / yukarıdan aşağıya) ipucu şeridinde yazar. Listeye dokunarak bütün ipuçlarını görebilir, istediğin kelimeye atlayabilirsin.'],
  ['Hücreye Dokun, Yaz', 'Hücreye dokununca kelime seçilir ve telefonunun klavyesi açılır; aynı hücreye ikinci dokunuş yönü değiştirir. Harfler otomatik olarak sonraki boş hücreye ilerler. Bilgisayarda fiziksel klavye, ok tuşları ve Tab da çalışır. İpucu şeridi klavye açıkken de ekranın üstünde kalır.'],
  ['Kesişimleri Kullan', 'Bir kelimeyi çözmek, kesiştiği kelimelere harf kazandırır. Doğru tamamlanan kelime yeşil yanar.'],
  ['Yanlışı Dert Etme', 'Bir kelimeyi yanlış tamamlarsan kısa bir uyarıdan sonra o kelime kendiliğinden temizlenir; harf harf geri silmen gerekmez. İpucuyla açtığın harfler ve kesiştiği çözülmüş kelimeden gelen harfler yerinde kalır — kazandığın hiçbir bilgiyi kaybetmezsin.'],
  ['Takılırsan Harf Aç', 'Seçili hücrenin harfini açar; karşılığında sürene +15 saniye eklenir. Açılan harf köşesinde turuncu işaret taşır — silinemez ve değiştirilemez.'],
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
      {/* Sayfa ölü uçtu: altı adımı okuyup bitiyordu, hiçbir çıkışı yoktu. */}
      <div className="mt-8 flex flex-col gap-2">
        <Link href="/"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-[var(--ink)] font-semibold text-[var(--paper)] transition-transform active:scale-[0.98]">
          Bugünün Bulmacalarına Git
        </Link>
        <Link href="/archive"
          className="flex min-h-11 items-center justify-center rounded-2xl border border-[var(--line)] text-sm font-medium">
          Arşivde Pratik Yap
        </Link>
      </div>
    </main>
  );
}
