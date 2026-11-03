import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/permissions';
import { Emblem } from '@/components/site/Logo';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentUser()) redirect('/admin');
  const { next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-navy/[0.08] bg-white p-7 shadow-soft">
        <div className="flex items-center gap-3 text-navy">
          <Emblem className="h-10 w-10" />
          <div>
            <p className="font-heading text-lg font-extrabold tracking-[0.2em]">IACEC</p>
            <p className="text-xs text-ink/50">Website administration</p>
          </div>
        </div>
        <h1 className="mt-6 text-xl text-navy">Sign in</h1>
        <LoginForm next={next ?? '/admin'} />
      </div>
    </div>
  );
}
