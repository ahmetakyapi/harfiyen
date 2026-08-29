/**
 * Postgres unique_violation (SQLSTATE 23505). Drizzle sarmalar: attığı
 * `DrizzleQueryError`in `.cause` alanında asıl pg hatası (neon-http ve
 * pglite sürücülerinde `code: '23505'`) durur — hem kendisini hem cause'u kontrol et.
 */
export function isUniqueViolation(err: unknown): boolean {
  const hasCode = (e: unknown): boolean =>
    typeof e === 'object' && e !== null && 'code' in e && (e as { code?: unknown }).code === '23505';
  if (hasCode(err)) return true;
  const cause = err instanceof Error ? err.cause : undefined;
  return hasCode(cause);
}
