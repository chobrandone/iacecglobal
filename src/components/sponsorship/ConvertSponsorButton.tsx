'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { convertSubmissionToSponsor } from '@/app/admin/(panel)/sponsorship/_actions';
import { Button } from '@/components/admin/ui';

export function ConvertSponsorButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function convert() {
    setBusy(true);
    const res = await convertSubmissionToSponsor(submissionId);
    setBusy(false);
    if (!res.ok) return void toast.error(res.error ?? 'This could not be converted.');
    router.push(`/admin/sponsorship/sponsors/${res.id}`);
  }

  return (
    <Button variant="gold" onClick={convert} disabled={busy} className="mb-4">
      Convert to sponsor
    </Button>
  );
}
