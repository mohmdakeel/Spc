// middleware.ts
import { NextResponse, NextRequest } from 'next/server';

const COOKIE_NAME = 'SPC_JWT';
const PUBLIC = new Set<string>([
  '/', '/login', '/_next', '/favicon.ico', '/assets', '/public'
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow public assets & login
  if ([...PUBLIC].some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // need token for everything else
  const hasJwt = !!req.cookies.get(COOKIE_NAME)?.value;
  if (!hasJwt) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
