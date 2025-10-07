import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Keep middleware minimal. Do NOT guess landing here.
 *
 * Only redirect root "/" to "/login" so we avoid 404s and loops.
 *
 * All other routing decisions happen server-side in pages.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
