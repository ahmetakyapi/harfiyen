import { NextResponse } from 'next/server'

// GET /api/health — deployment sonrası kontrol için
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
}
