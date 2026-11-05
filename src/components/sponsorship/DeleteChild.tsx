'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteChildPermanently } from '@/app/admin/(panel)/sponsorship/_actions';
import { Button, Input, Label } from '@/components/admin/ui';

export function DeleteChild({ id, reference }: { id: string; reference: string }) {
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const res = await deleteChildPermanently(id, typed);
    setBusy(false);
    if (!res.ok) return void toast.error(res.error ?? 'This could not be deleted.');
    toast.success('Record permanently deleted');
    router.push('/admin/sponsorship/applications');
  }

  return (
    <div className="max-w-md">
      <Label htmlFor="confirm-delete" help="Download the profile PDF first if the family asked for a copy.">
        Type {reference} to confirm
      </Label>
      <Input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} />
      <Button variant="danger" className="mt-3" disabled={busy || typed !== reference} onClick={remove}>
        Delete permanently
      </Button>
    </div>
  );
}
