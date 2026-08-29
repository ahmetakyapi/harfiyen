import { z } from 'zod';

// Eksik ortam değişkeni eskiden ancak KULLANIM anında patlıyordu: AUTH_SECRET
// hiçbir yerde kontrol edilmiyordu, uygulama açılıyor ve yalnızca ilk giriş
// denemesi anlaşılmaz bir `MissingSecret` ile çöküyordu.
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL tanımlı değil'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET tanımlı değil'),
  ANON_COOKIE_SECRET: z.string().min(1, 'ANON_COOKIE_SECRET tanımlı değil'),
});

export type Env = z.infer<typeof schema>;

/**
 * Sunucu tarafında gerekli değişkenleri doğrular. Build sırasında ÇAĞRILMAZ —
 * sayfalar force-dynamic olduğundan derleme aşamasında DB'ye ihtiyaç yok ve
 * derlemeyi env eksikliğiyle kırmak istemiyoruz.
 */
export function requireEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.message).join(', ');
    throw new Error(`Ortam değişkeni eksik: ${missing}`);
  }
  return parsed.data;
}

/** Yalnızca DB bağlantısı için (auth gerektirmeyen script'ler de kullanır). */
export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL tanımlı değil');
  return url;
}
