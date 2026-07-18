import { NextResponse } from 'next/server';
import { SessionError } from './session';

const STATUS: Record<SessionError['code'], number> = {
  NOT_FOUND: 404, PUZZLE_NOT_FOUND: 404, FORBIDDEN: 403, NOT_ACTIVE: 409, INVALID_CELL: 409,
};

export function sessionErrorResponse(err: unknown): NextResponse | null {
  if (!(err instanceof SessionError)) return null;
  return NextResponse.json({ error: err.code }, { status: STATUS[err.code] });
}
