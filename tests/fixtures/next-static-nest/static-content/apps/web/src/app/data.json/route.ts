import { type NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-static';
export function GET(_request: NextRequest) {
  return NextResponse.json({ generated: 'static-get' });
}
