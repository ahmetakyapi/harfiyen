import { describe, expect, it } from 'vitest';
import { makeAnonToken, verifyAnonToken } from './anon';

describe('anon token', () => {
  it('imzalar ve doğrular; kurcalanmışı reddeder', () => {
    const token = makeAnonToken('sir');
    const id = verifyAnonToken(token, 'sir');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(verifyAnonToken(token, 'baska-sir')).toBeNull();
    expect(verifyAnonToken(`${token}x`, 'sir')).toBeNull();
    expect(verifyAnonToken('bozuk', 'sir')).toBeNull();
  });
});
