// middleware.ts
import { NextResponse, NextRequest } from 'next/server';

const COOKIE_NAME = 'SPC_JWT';
const PUBLIC = new Set<string>(['/', '/login', '/403', '/_next', '/favicon.ico', '/assets', '/public']);
const PROXY_PREFIXES = ['/aapi', '/tapi'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow public assets & login
  if ([...PUBLIC].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (PROXY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  // need token for everything else
  const hasJwt = !!req.cookies.get(COOKIE_NAME)?.value;
  if (!hasJwt) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    // Do not preserve the previous path; force a clean login screen
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
