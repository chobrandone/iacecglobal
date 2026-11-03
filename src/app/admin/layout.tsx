import type { Metadata } from 'next';
import { Toaster } from 'sonner';

export const metadata: Metadata = { title: { absolute: 'IACEC Admin' }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist font-body text-ink">
      {children}
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
