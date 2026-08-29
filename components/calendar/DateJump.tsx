'use client';

import { useRouter } from 'next/navigation';
import { DatePicker } from './DatePicker';

/**
 * Sunucu bileşenlerinden kullanılabilen ince sarmalayıcı: seçim yapılınca
 * verilen kalıptaki `{date}` yerine seçilen günü koyup oraya gider.
 * (Fonksiyon prop'u sunucu/istemci sınırını geçemez, bu yüzden kalıp string.)
 */
export function DateJump({ selected, today, hrefPattern, label, maxSelectable }: {
  selected: string; today: string; hrefPattern: string;
  label?: React.ReactNode; maxSelectable?: string;
}) {
  const router = useRouter();
  return (
    <DatePicker selected={selected} today={today} label={label} maxSelectable={maxSelectable}
      onSelect={(date) => router.push(hrefPattern.replaceAll('{date}', date))} />
  );
}
