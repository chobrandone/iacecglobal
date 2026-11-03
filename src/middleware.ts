import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !req.auth?.user) {
    const url = new URL('/admin/login', req.nextUrl.origin);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  // Expose the path to server components (used by the 404 page).
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|media/|uploads/|api/auth).*)'],
};
