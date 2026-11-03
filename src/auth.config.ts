import type { NextAuthConfig } from 'next-auth';

export type AppRole = 'ADMIN' | 'EDITOR' | 'SPONSORSHIP_COORDINATOR';

/**
 * Edge-safe part of the Auth.js configuration (no database, no bcrypt), shared by the
 * middleware. Credential checking lives in src/auth.ts.
 */
export const authConfig = {
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login')) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: AppRole }).role;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        (session.user as { role?: AppRole }).role = token.role as AppRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
