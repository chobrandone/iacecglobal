import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { clientIp } from '@/lib/client-fingerprint';
import { prisma } from '@/lib/db';
import { MINUTE, clearLimit, hashKey, hit, isBlocked } from '@/lib/rate-limit';
import { authConfig } from './auth.config';

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });

const WINDOW = 15 * MINUTE;
const ACCOUNT_LIMIT = 5;
const CONNECTION_LIMIT = 30;

// Compared against when the email is unknown, so the response time does not reveal which accounts exist.
const NO_USER_HASH = bcrypt.hashSync('no-such-user', 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        const accountKey = `login:account:${hashKey(email)}`;
        const connectionKey = `login:ip:${hashKey(clientIp(request.headers))}`;
        if ((await isBlocked(accountKey, ACCOUNT_LIMIT)) || (await isBlocked(connectionKey, CONNECTION_LIMIT))) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? NO_USER_HASH);
        if (!user || !user.active || !ok) {
          await Promise.all([hit(accountKey, ACCOUNT_LIMIT, WINDOW), hit(connectionKey, CONNECTION_LIMIT, WINDOW)]);
          return null;
        }
        await clearLimit(accountKey);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
