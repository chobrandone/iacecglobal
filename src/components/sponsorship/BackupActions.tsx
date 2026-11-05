'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { backUpNow, disconnectDrive, testDriveConnection } from '@/app/admin/(panel)/sponsorship/_actions';
import { Button } from '@/components/admin/ui';

export function BackUpNowButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await backUpNow();
        setBusy(false);
        if (!res.ok) return void toast.error(res.error ?? 'The backup could not start.');
        toast.success('Backup started. This can take a few minutes.');
        router.refresh();
      }}
    >
      {busy ? 'Starting…' : 'Back up now'}
    </Button>
  );
}

export function BackupActions({ connected, canConnect }: { connected: boolean; canConnect: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function test() {
    setBusy(true);
    const res = await testDriveConnection();
    setBusy(false);
    if (res.ok) toast.success('Connected: a test file was created and deleted.');
    else toast.error(res.error ?? 'The connection failed.');
  }

  async function disconnect() {
    if (!window.confirm('Disconnect Google Drive? Backups stop until it is connected again. Files already in Drive stay there.')) return;
    await disconnectDrive();
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canConnect && !connected && (
        // eslint-disable-next-line @next/next/no-html-link-for-pages -- leaves the site for Google
        <a href="/api/google/oauth">
          <Button variant="gold">Connect Google Drive</Button>
        </a>
      )}
      {connected && (
        <>
          <Button variant="outline" onClick={test} disabled={busy}>
            {busy ? 'Testing…' : 'Test connection'}
          </Button>
          <BackUpNowButton />
          {canConnect && (
            <Button variant="ghost" onClick={disconnect}>
              Disconnect
            </Button>
          )}
        </>
      )}
    </div>
  );
}
