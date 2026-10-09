import Link from 'next/link';
import { KineticTitle } from '@/components/motion/KineticTitle';

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
    <main className="page-enter mx-auto max-w-lg px-4 py-10">
      <KineticTitle text="Nasıl Oynanır?"
        className="font-display-flourish text-center font-display text-[2.5rem] leading-tight tracking-tight sm:text-5xl" />
      <p className="rise mt-3 text-center text-sm text-[var(--ink-soft)]" style={{ '--i': 2 } as React.CSSProperties}>
        Altı adımda bir kare bulmaca.
      </p>
      {/* Adımlar gerçek bir sıra: numaralı hücreleri tek bir mürekkep ipliği
          bağlar ve iplik sayfayı kaydırdıkça aşağı doğru çizilir (saf CSS,
          kaydırma zaman çizelgesi; destek yoksa iplik tam boyda durur). */}
      <ol className="relative mt-10">
        <span aria-hidden className="absolute bottom-6 left-[1.125rem] top-6 w-px bg-[var(--line)]" />
        <span aria-hidden className="ink-thread absolute bottom-6 left-[1.125rem] top-6 w-px origin-top bg-[var(--accent)]" />
        {STEPS.map(([title, body], i) => (
          <li key={title} className="reveal relative flex gap-5 pb-8 last:pb-0">
            {/* Adım numaraları oyunun hücre numaralandırma dilinde — köşeli taş */}
            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-[var(--accent)] font-display font-semibold text-[var(--paper)] shadow-[0_0_0_6px_var(--paper)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-4 transition-[transform,box-shadow] duration-500 ease-[var(--ease-expo)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_var(--ink)]">
              <p className="font-display text-lg leading-snug">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      {/* Sayfa ölü uçtu: altı adımı okuyup bitiyordu, hiçbir çıkışı yoktu. */}
      <div className="reveal mt-10 flex flex-col gap-2">
        <Link href="/"
          className="btn-wipe flex min-h-12 items-center justify-center rounded-2xl bg-[var(--ink)] font-semibold text-[var(--paper)] transition-transform active:scale-[0.98]">
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
