import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/permissions';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentUser()) redirect('/admin');
  const { next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-navy/[0.08] bg-white p-7 shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/brand/iacec-logo.png" alt="IACEC" className="h-11 w-auto" />
        <p className="mt-2 text-xs text-ink/50">Website administration</p>
        <h1 className="mt-6 text-xl text-navy">Sign in</h1>
        <LoginForm next={next ?? '/admin'} />
      </div>
    </div>
  );
}
