import { NextResponse } from 'next/server';
import { SessionError } from './session';

const STATUS: Record<SessionError['code'], number> = {
  NOT_FOUND: 404, PUZZLE_NOT_FOUND: 404, FORBIDDEN: 403, NOT_ACTIVE: 409,
  INVALID_CELL: 409, HINT_LIMIT: 429,
};

// Ekranda gösterilecek Türkçe karşılıklar. Kod adları İngilizce (mimari),
// kullanıcıya giden metin Türkçe.
const MESSAGE: Partial<Record<SessionError['code'], string>> = {
  HINT_LIMIT: 'Bu bulmaca için harf açma hakkın doldu.',
  NOT_ACTIVE: 'Bu oturum artık açık değil.',
  FORBIDDEN: 'Bu oturum sana ait değil.',
};

export function sessionErrorResponse(err: unknown): NextResponse | null {
  if (!(err instanceof SessionError)) return null;
  return NextResponse.json(
    { error: err.code, message: MESSAGE[err.code] },
    { status: STATUS[err.code] },
  );
}
