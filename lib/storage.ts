'use client';

// localStorage her ortamda güvenilir DEĞİL: Safari özel gezintide ve site
// verisi engellenmiş tarayıcılarda okuma/yazma istisna atar, kota dolduğunda
// da QuotaExceededError gelir. Bu çağrılar eskiden GameBoard'un içinde çıplak
// duruyordu; bozuk tek bir kayıt "Bağlantı kurulamadı" hatasına dönüşüp
// oyuncuyu bulmacadan tamamen dışarıda bırakabiliyordu (oturum sunucuda
// açıldığı için süre de işlemeye devam ediyordu).
export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    // Bozuk kayıt bir daha aynı hatayı vermesin diye temizlenir.
    try { localStorage.removeItem(key); } catch { /* yok say */ }
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Kayıt sadece bir kolaylık; yazılamaması oyunu durdurmaz.
  }
}

export function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function writeFlag(key: string): void {
  try { localStorage.setItem(key, '1'); } catch { /* yok say */ }
}

export function remove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* yok say */ }
}
