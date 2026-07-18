import type { Direction } from './types';

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function wordHash(publicId: string, no: number, dir: Direction, answer: string): Promise<string> {
  return sha256Hex(`${publicId}:${no}:${dir}:${answer}`);
}
