import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DRIVE_SCOPE_OAUTH, oauthClient } from '@/lib/drive/client';
import { can, currentUser } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { encrypt } from '@/lib/sponsorship/encryption';

export const runtime = 'nodejs';

const COOKIE = 'google-oauth-state';

/** "Connect Google Drive": sends the Administrator to Google, then stores the encrypted refresh token. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user || !can(user.role, 'sponsorship-admin')) return new NextResponse(null, { status: 403 });

  const url = new URL(req.url);
  const backups = new URL('/admin/sponsorship/backups', url.origin);
  const code = url.searchParams.get('code');
  const jar = await cookies();

  if (!code) {
    if (url.searchParams.get('error')) return NextResponse.redirect(`${backups}?google=denied`);
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID) return NextResponse.redirect(`${backups}?google=missing`);
    const state = randomBytes(16).toString('hex');
    jar.set(COOKIE, state, { httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', maxAge: 600, path: '/api/google' });
    return NextResponse.redirect(oauthClient().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: [DRIVE_SCOPE_OAUTH], state }));
  }

  if (!jar.get(COOKIE)?.value || jar.get(COOKIE)?.value !== url.searchParams.get('state')) return new NextResponse('This link has expired. Please try connecting again.', { status: 400 });
  jar.delete(COOKIE);
  const { tokens } = await oauthClient().getToken(code);
  if (!tokens.refresh_token) return NextResponse.redirect(`${backups}?google=failed`);
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { googleRefreshToken: encrypt(tokens.refresh_token) } });
  await audit(user, 'edit', 'google-drive', undefined, { connected: true });
  return NextResponse.redirect(`${backups}?google=connected`);
}
