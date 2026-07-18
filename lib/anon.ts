import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const ANON_COOKIE = 'harfiyen_anon';

function sign(id: string, secret: string): string {
  return createHmac('sha256', secret).update(id).digest('hex');
}

export function makeAnonToken(secret: string): string {
  const id = randomUUID();
  return `${id}.${sign(id, secret)}`;
}

export function verifyAnonToken(token: string, secret: string): string | null {
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const id = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(id, secret);
  if (mac.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(mac), Buffer.from(expected)) ? id : null;
}
